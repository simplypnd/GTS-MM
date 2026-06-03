-- Enums
CREATE TYPE profile_role AS ENUM ('buyer', 'seller', 'mediator');
CREATE TYPE deal_status AS ENUM (
  'draft', 'awaiting_payment', 'funded', 'in_progress',
  'completed', 'refunded', 'disputed', 'expired', 'cancelled'
);
CREATE TYPE participant_role AS ENUM ('buyer', 'seller', 'mediator');
CREATE TYPE party_role AS ENUM ('buyer', 'seller');
CREATE TYPE transfer_type AS ENUM ('release', 'refund');
CREATE TYPE transfer_status AS ENUM ('pending', 'succeeded', 'failed');
CREATE TYPE dispute_resolution AS ENUM ('release', 'refund', 'partial');

-- Profiles
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  role profile_role NOT NULL DEFAULT 'buyer',
  is_mediator BOOLEAN NOT NULL DEFAULT FALSE,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Payout accounts (stored in app DB, sent to PayMongo per transfer)
CREATE TABLE payout_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  party_role party_role NOT NULL,
  account_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  bank_bic TEXT NOT NULL,
  bank_name TEXT,
  is_default BOOLEAN NOT NULL DEFAULT TRUE,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX payout_accounts_default_per_role
  ON payout_accounts (user_id, party_role)
  WHERE is_default = TRUE;

-- Deals
CREATE TABLE deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  amount_centavos BIGINT NOT NULL CHECK (amount_centavos > 0),
  currency TEXT NOT NULL DEFAULT 'PHP',
  buyer_id UUID NOT NULL REFERENCES profiles(id),
  seller_id UUID NOT NULL REFERENCES profiles(id),
  status deal_status NOT NULL DEFAULT 'draft',
  platform_fee_bps INT NOT NULL DEFAULT 0 CHECK (platform_fee_bps >= 0 AND platform_fee_bps <= 10000),
  created_by UUID NOT NULL REFERENCES profiles(id),
  parties_locked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (buyer_id <> seller_id),
  CHECK (created_by = buyer_id OR created_by = seller_id)
);

CREATE INDEX deals_buyer_id ON deals(buyer_id);
CREATE INDEX deals_seller_id ON deals(seller_id);
CREATE INDEX deals_status ON deals(status);

-- Deal participants
CREATE TABLE deal_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role participant_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (deal_id, user_id),
  UNIQUE (deal_id, role)
);

-- PayMongo payments
CREATE TABLE paymongo_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  payment_intent_id TEXT NOT NULL UNIQUE,
  client_key TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  qr_image_url TEXT,
  expires_at TIMESTAMPTZ,
  paid_by_user_id UUID REFERENCES profiles(id),
  raw_webhook JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- PayMongo transfers
CREATE TABLE paymongo_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  type transfer_type NOT NULL,
  recipient_user_id UUID NOT NULL REFERENCES profiles(id),
  recipient_role party_role NOT NULL,
  payout_account_id UUID REFERENCES payout_accounts(id),
  batch_transfer_id TEXT,
  transfer_id TEXT,
  amount_centavos BIGINT NOT NULL,
  status transfer_status NOT NULL DEFAULT 'pending',
  reference_number TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  destination_snapshot JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX paymongo_transfers_recipient ON paymongo_transfers(recipient_user_id);

-- Disputes
CREATE TABLE disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL UNIQUE REFERENCES deals(id) ON DELETE CASCADE,
  opened_by UUID NOT NULL REFERENCES profiles(id),
  opened_by_role party_role NOT NULL,
  reason TEXT NOT NULL,
  mediator_id UUID REFERENCES profiles(id),
  resolution dispute_resolution,
  seller_amount_centavos BIGINT,
  buyer_amount_centavos BIGINT,
  resolution_notes TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX disputes_opened_by_role ON disputes(opened_by_role);

-- Messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id),
  sender_role participant_role,
  body TEXT NOT NULL,
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX messages_deal_created ON messages(deal_id, created_at);

-- Deal events audit
CREATE TABLE deal_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES profiles(id),
  actor_role participant_role,
  event TEXT NOT NULL,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed deal participants on deal insert
CREATE OR REPLACE FUNCTION seed_deal_participants()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO deal_participants (deal_id, user_id, role) VALUES
    (NEW.id, NEW.buyer_id, 'buyer'),
    (NEW.id, NEW.seller_id, 'seller');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_deal_created_participants
  AFTER INSERT ON deals
  FOR EACH ROW EXECUTE FUNCTION seed_deal_participants();

-- Lock buyer/seller after payment starts
CREATE OR REPLACE FUNCTION lock_deal_parties()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.parties_locked_at IS NOT NULL THEN
    IF NEW.buyer_id <> OLD.buyer_id OR NEW.seller_id <> OLD.seller_id THEN
      RAISE EXCEPTION 'buyer_id and seller_id are immutable after payment starts';
    END IF;
  END IF;
  IF NEW.status = 'awaiting_payment' AND OLD.status = 'draft' THEN
    NEW.parties_locked_at := NOW();
  END IF;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_deal_update_lock
  BEFORE UPDATE ON deals
  FOR EACH ROW EXECUTE FUNCTION lock_deal_parties();

-- Profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, display_name, role, is_mediator)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'role')::profile_role, 'buyer'),
    COALESCE((NEW.raw_user_meta_data->>'role') = 'mediator', FALSE)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE paymongo_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE paymongo_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_events ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY profiles_select ON profiles FOR SELECT USING (true);
CREATE POLICY profiles_update_own ON profiles FOR UPDATE USING (auth.uid() = id);

-- Payout accounts
CREATE POLICY payout_own ON payout_accounts FOR ALL USING (auth.uid() = user_id);

-- Helper: is deal participant
CREATE OR REPLACE FUNCTION is_deal_participant(p_deal_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM deal_participants
    WHERE deal_id = p_deal_id AND user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Deals policies
CREATE POLICY deals_select ON deals FOR SELECT USING (
  buyer_id = auth.uid() OR seller_id = auth.uid()
  OR EXISTS (SELECT 1 FROM disputes d WHERE d.deal_id = deals.id AND d.mediator_id = auth.uid())
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_mediator = TRUE AND deals.status = 'disputed')
);

CREATE POLICY deals_insert ON deals FOR INSERT WITH CHECK (
  created_by = auth.uid() AND (buyer_id = auth.uid() OR seller_id = auth.uid())
);

CREATE POLICY deals_update_participant ON deals FOR UPDATE USING (
  buyer_id = auth.uid() OR seller_id = auth.uid()
);

-- Deal participants
CREATE POLICY deal_participants_select ON deal_participants FOR SELECT USING (is_deal_participant(deal_id));

-- Messages
CREATE POLICY messages_select ON messages FOR SELECT USING (is_deal_participant(deal_id));
CREATE POLICY messages_insert ON messages FOR INSERT WITH CHECK (
  is_deal_participant(deal_id) AND (sender_id = auth.uid() OR is_system = TRUE)
);

-- Disputes
CREATE POLICY disputes_select ON disputes FOR SELECT USING (
  EXISTS (SELECT 1 FROM deal_participants dp WHERE dp.deal_id = disputes.deal_id AND dp.user_id = auth.uid())
  OR mediator_id = auth.uid()
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_mediator = TRUE)
);

CREATE POLICY disputes_insert ON disputes FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM deals d WHERE d.id = deal_id AND d.status IN ('funded', 'in_progress')
    AND (d.buyer_id = auth.uid() OR d.seller_id = auth.uid()))
);

-- Deal events read for participants
CREATE POLICY deal_events_select ON deal_events FOR SELECT USING (is_deal_participant(deal_id));

-- Payments/transfers read for participants
CREATE POLICY paymongo_payments_select ON paymongo_payments FOR SELECT USING (is_deal_participant(deal_id));
CREATE POLICY paymongo_transfers_select ON paymongo_transfers FOR SELECT USING (is_deal_participant(deal_id));

-- Realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
