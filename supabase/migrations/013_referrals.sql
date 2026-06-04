-- Referral program: codes, attribution, payouts, is_admin

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referral_code TEXT,
  ADD COLUMN IF NOT EXISTS referred_by_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_referral_code_lower_key
  ON public.profiles (lower(trim(referral_code)))
  WHERE referral_code IS NOT NULL;

CREATE OR REPLACE FUNCTION public.generate_referral_code(p_display_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_base TEXT;
  v_candidate TEXT;
  v_suffix INT := 0;
BEGIN
  v_base := lower(regexp_replace(trim(coalesce(p_display_name, '')), '[^a-z0-9]', '', 'g'));
  IF length(v_base) < 3 THEN
    v_base := 'user';
  END IF;
  v_base := left(v_base, 20);
  LOOP
    v_candidate := CASE WHEN v_suffix = 0 THEN v_base ELSE v_base || v_suffix::TEXT END;
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM public.profiles WHERE lower(trim(referral_code)) = lower(trim(v_candidate))
    );
    v_suffix := v_suffix + 1;
    IF v_suffix > 9999 THEN
      v_candidate := v_base || substr(replace(gen_random_uuid()::TEXT, '-', ''), 1, 6);
      EXIT;
    END IF;
  END LOOP;
  RETURN v_candidate;
END;
$$;

CREATE OR REPLACE FUNCTION public.protect_profile_admin_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND auth.uid() = OLD.id THEN
    IF NEW.is_mediator IS DISTINCT FROM OLD.is_mediator
       OR NEW.is_admin IS DISTINCT FROM OLD.is_admin
       OR NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'Only an administrator can change role, mediator, or admin status';
    END IF;
    IF NEW.referred_by_user_id IS DISTINCT FROM OLD.referred_by_user_id THEN
      RAISE EXCEPTION 'Referral attribution cannot be changed';
    END IF;
    IF NEW.referral_code IS DISTINCT FROM OLD.referral_code THEN
      RAISE EXCEPTION 'Referral code cannot be changed';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_display_name TEXT;
  v_referral_code TEXT;
  v_ref_code_meta TEXT;
  v_referrer_id UUID;
BEGIN
  v_display_name := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'display_name'), ''),
    NULLIF(TRIM(split_part(COALESCE(NEW.email, ''), '@', 1)), ''),
    'User'
  );

  v_referral_code := public.generate_referral_code(v_display_name);

  v_ref_code_meta := NULLIF(TRIM(NEW.raw_user_meta_data->>'referral_code'), '');
  IF v_ref_code_meta IS NOT NULL THEN
    SELECT id INTO v_referrer_id
    FROM public.profiles
    WHERE lower(trim(referral_code)) = lower(trim(v_ref_code_meta))
      AND id <> NEW.id
    LIMIT 1;
  END IF;

  INSERT INTO public.profiles (
    id,
    display_name,
    role,
    is_mediator,
    is_admin,
    referral_code,
    referred_by_user_id
  )
  VALUES (
    NEW.id,
    v_display_name,
    'buyer'::public.profile_role,
    FALSE,
    FALSE,
    v_referral_code,
    v_referrer_id
  );

  RETURN NEW;
END;
$$;

-- Backfill referral codes for existing profiles
UPDATE public.profiles
SET referral_code = public.generate_referral_code(display_name)
WHERE referral_code IS NULL;

ALTER TABLE public.profiles
  ALTER COLUMN referral_code SET NOT NULL;

CREATE TABLE IF NOT EXISTS public.referral_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL UNIQUE REFERENCES public.deals(id) ON DELETE CASCADE,
  referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount_centavos BIGINT NOT NULL CHECK (amount_centavos > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS referral_payouts_referrer_created
  ON public.referral_payouts (referrer_id, created_at DESC);

ALTER TABLE public.referral_payouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS referral_payouts_select_own ON public.referral_payouts;
CREATE POLICY referral_payouts_select_own ON public.referral_payouts
  FOR SELECT
  USING (referrer_id = auth.uid());

GRANT SELECT ON public.referral_payouts TO authenticated;
