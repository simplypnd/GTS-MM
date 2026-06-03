-- Deal reviews (buyer rates seller after completed deal)
CREATE TABLE deal_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE UNIQUE,
  reviewer_id UUID NOT NULL REFERENCES profiles(id),
  reviewee_id UUID NOT NULL REFERENCES profiles(id),
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX deal_reviews_reviewee ON deal_reviews(reviewee_id, created_at DESC);

ALTER TABLE deal_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY deal_reviews_select ON deal_reviews FOR SELECT USING (true);

CREATE POLICY deal_reviews_insert ON deal_reviews FOR INSERT WITH CHECK (
  reviewer_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM deals d
    WHERE d.id = deal_id
      AND d.status = 'completed'
      AND d.buyer_id = auth.uid()
      AND d.seller_id = reviewee_id
  )
  AND NOT EXISTS (SELECT 1 FROM deal_reviews r WHERE r.deal_id = deal_id)
);

-- Public profile RPC (completed deals + reputation)
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
      d.amount_centavos,
      d.updated_at AS completed_at,
      CASE WHEN d.buyer_id = v_profile.id THEN 'buyer' ELSE 'seller' END AS role
    FROM deals d
    WHERE d.status = 'completed'
      AND (d.buyer_id = v_profile.id OR d.seller_id = v_profile.id)
    ORDER BY d.updated_at DESC
    LIMIT 10
  ) t;

  RETURN json_build_object(
    'display_name', v_profile.display_name,
    'member_since', v_profile.created_at,
    'positive_percent', v_positive_percent,
    'review_count', v_review_count,
    'recent_deals', v_recent_deals
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_public_profile(TEXT) TO anon, authenticated;
