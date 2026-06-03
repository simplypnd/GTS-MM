-- Wallet balance on profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS balance_centavos BIGINT NOT NULL DEFAULT 0
  CHECK (balance_centavos >= 0);

-- Optional payment source on deals
ALTER TABLE deals
  ADD COLUMN IF NOT EXISTS payment_source TEXT;

-- Extend transfer type for withdrawals
ALTER TYPE transfer_type ADD VALUE IF NOT EXISTS 'withdrawal';

-- PayMongo transfers: withdrawals without deal, provider + fee
ALTER TABLE paymongo_transfers
  ALTER COLUMN deal_id DROP NOT NULL;

ALTER TABLE paymongo_transfers
  ADD COLUMN IF NOT EXISTS provider TEXT,
  ADD COLUMN IF NOT EXISTS fee_centavos BIGINT NOT NULL DEFAULT 0;

-- Balance ledger
CREATE TABLE balance_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount_centavos BIGINT NOT NULL,
  kind TEXT NOT NULL,
  deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
  reference_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX balance_ledger_user_created ON balance_ledger(user_id, created_at DESC);

-- Prevent clients from editing balance directly
CREATE OR REPLACE FUNCTION prevent_profile_balance_self_update()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.balance_centavos IS DISTINCT FROM OLD.balance_centavos THEN
    IF auth.uid() = NEW.id AND current_setting('role', true) NOT IN ('service_role', 'supabase_admin') THEN
      RAISE EXCEPTION 'balance_centavos cannot be updated directly';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_balance_guard ON profiles;
CREATE TRIGGER profiles_balance_guard
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION prevent_profile_balance_self_update();

-- Atomic balance credit/debit (service role or definer)
CREATE OR REPLACE FUNCTION apply_balance_delta(
  p_user_id UUID,
  p_delta BIGINT,
  p_kind TEXT,
  p_deal_id UUID DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_balance BIGINT;
BEGIN
  IF p_delta = 0 THEN
    RAISE EXCEPTION 'delta must be non-zero';
  END IF;

  UPDATE profiles
  SET balance_centavos = balance_centavos + p_delta,
      updated_at = NOW()
  WHERE id = p_user_id
  RETURNING balance_centavos INTO v_new_balance;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'profile not found';
  END IF;

  IF v_new_balance < 0 THEN
    RAISE EXCEPTION 'insufficient balance';
  END IF;

  INSERT INTO balance_ledger (user_id, amount_centavos, kind, deal_id, reference_id, metadata)
  VALUES (p_user_id, p_delta, p_kind, p_deal_id, p_reference_id, p_metadata);

  RETURN v_new_balance;
END;
$$;

-- RLS balance_ledger
ALTER TABLE balance_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY balance_ledger_select_own ON balance_ledger
  FOR SELECT USING (user_id = auth.uid());

-- Users can read their own withdrawal transfers
CREATE POLICY paymongo_transfers_select_recipient ON paymongo_transfers
  FOR SELECT USING (recipient_user_id = auth.uid());
