-- Platform settings, user moderation, admin search RPCs

CREATE TABLE IF NOT EXISTS public.platform_settings (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  platform_fee_bps INT NOT NULL DEFAULT 500 CHECK (platform_fee_bps BETWEEN 0 AND 10000),
  referral_reward_bps INT NOT NULL DEFAULT 50 CHECK (referral_reward_bps BETWEEN 0 AND 10000),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.platform_settings (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_status TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS funds_frozen BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS referral_reward_bps INT;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_account_status_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_account_status_check
  CHECK (account_status IN ('active', 'suspended', 'blocked'));

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_referral_reward_bps_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_referral_reward_bps_check
  CHECK (
    referral_reward_bps IS NULL
    OR (referral_reward_bps >= 0 AND referral_reward_bps <= 10000)
  );

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
    IF NEW.account_status IS DISTINCT FROM OLD.account_status THEN
      RAISE EXCEPTION 'Account status cannot be changed by user';
    END IF;
    IF NEW.funds_frozen IS DISTINCT FROM OLD.funds_frozen THEN
      RAISE EXCEPTION 'Funds freeze cannot be changed by user';
    END IF;
    IF NEW.referral_reward_bps IS DISTINCT FROM OLD.referral_reward_bps THEN
      RAISE EXCEPTION 'Referral reward rate cannot be changed by user';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_platform_settings()
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT to_jsonb(ps)
  FROM public.platform_settings ps
  WHERE ps.id = 1;
$$;

CREATE OR REPLACE FUNCTION public.admin_search_users(
  p_query TEXT,
  p_limit INT DEFAULT 20
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_q TEXT;
  v_limit INT;
BEGIN
  v_q := trim(coalesce(p_query, ''));
  v_limit := GREATEST(1, LEAST(COALESCE(p_limit, 20), 50));

  IF v_q = '' THEN
    RETURN '[]'::JSONB;
  END IF;

  RETURN COALESCE(
    (
      SELECT jsonb_agg(row_to_json(t)::JSONB ORDER BY t.created_at DESC)
      FROM (
        SELECT
          p.id,
          p.display_name,
          p.balance_centavos,
          p.account_status,
          p.funds_frozen,
          p.referral_reward_bps,
          p.referral_code,
          p.is_admin,
          p.created_at
        FROM public.profiles p
        WHERE lower(trim(p.display_name)) LIKE '%' || lower(v_q) || '%'
           OR lower(trim(p.referral_code)) = lower(v_q)
           OR p.id::TEXT LIKE v_q || '%'
        ORDER BY p.created_at DESC
        LIMIT v_limit
      ) t
    ),
    '[]'::JSONB
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_platform_settings() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_platform_settings() TO service_role;

REVOKE ALL ON FUNCTION public.admin_search_users(TEXT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_search_users(TEXT, INT) TO service_role;
