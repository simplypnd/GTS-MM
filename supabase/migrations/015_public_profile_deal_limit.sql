-- Public profile: show at most 5 recent completed deals
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
      CASE
        WHEN d.buyer_id = v_profile.id THEN cp_seller.display_name
        ELSE cp_buyer.display_name
      END AS counterparty_name,
      d.updated_at AS completed_at,
      CASE WHEN d.buyer_id = v_profile.id THEN 'buyer' ELSE 'seller' END AS role
    FROM deals d
    JOIN profiles cp_buyer ON cp_buyer.id = d.buyer_id
    JOIN profiles cp_seller ON cp_seller.id = d.seller_id
    WHERE d.status = 'completed'
      AND (d.buyer_id = v_profile.id OR d.seller_id = v_profile.id)
    ORDER BY d.updated_at DESC
    LIMIT 5
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
