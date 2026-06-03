-- Profiles: own-row SELECT only; public fields via RPC
DROP POLICY IF EXISTS profiles_select ON profiles;
CREATE POLICY profiles_select_own ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION get_profiles_public(p_user_ids UUID[])
RETURNS TABLE (id UUID, display_name TEXT)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT p.id, p.display_name
  FROM profiles p
  WHERE p.id = ANY(p_user_ids);
$$;

GRANT EXECUTE ON FUNCTION get_profiles_public(UUID[]) TO authenticated, anon;

-- Public profile RPC: include profile id for review lookups
CREATE OR REPLACE FUNCTION get_public_profile(p_username TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile RECORD;
  v_positive_count BIGINT;
  v_review_count BIGINT;
  v_positive_percent NUMERIC;
  v_recent_deals JSON;
BEGIN
  SELECT id, display_name, created_at
  INTO v_profile
  FROM profiles
  WHERE lower(trim(display_name)) = lower(trim(p_username))
  LIMIT 1;

  IF v_profile.id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT
    COUNT(*) FILTER (WHERE rating >= 4),
    COUNT(*)
  INTO v_positive_count, v_review_count
  FROM deal_reviews
  WHERE reviewee_id = v_profile.id;

  IF v_review_count > 0 THEN
    v_positive_percent := ROUND((v_positive_count::numeric / v_review_count) * 1000) / 10;
  ELSE
    v_positive_percent := NULL;
  END IF;

  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
  INTO v_recent_deals
  FROM (
    SELECT
      d.id,
      d.title,
      d.updated_at AS completed_at,
      CASE WHEN d.buyer_id = v_profile.id THEN 'buyer' ELSE 'seller' END AS role
    FROM deals d
    WHERE d.status = 'completed'
      AND (d.buyer_id = v_profile.id OR d.seller_id = v_profile.id)
    ORDER BY d.updated_at DESC
    LIMIT 10
  ) t;

  RETURN json_build_object(
    'id', v_profile.id,
    'display_name', v_profile.display_name,
    'member_since', v_profile.created_at,
    'positive_percent', v_positive_percent,
    'review_count', v_review_count,
    'recent_deals', v_recent_deals
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_public_profile(TEXT) TO anon, authenticated;

-- Payments: no client SELECT on base table; QR fields via RPC
DROP POLICY IF EXISTS paymongo_payments_select ON paymongo_payments;

CREATE OR REPLACE FUNCTION get_deal_payment_qr(p_deal_id UUID)
RETURNS TABLE (
  qr_image_url TEXT,
  expires_at TIMESTAMPTZ,
  status TEXT
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT p.qr_image_url, p.expires_at, p.status
  FROM paymongo_payments p
  WHERE p.deal_id = p_deal_id
    AND is_deal_participant(p_deal_id)
  ORDER BY p.created_at DESC
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION get_deal_payment_qr(UUID) TO authenticated;
