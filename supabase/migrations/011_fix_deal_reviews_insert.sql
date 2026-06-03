-- Insert reviews via SECURITY DEFINER RPC (avoids brittle cross-table INSERT RLS)
CREATE OR REPLACE FUNCTION insert_deal_review(
  p_deal_id UUID,
  p_rating SMALLINT,
  p_comment TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deal RECORD;
  v_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  IF p_rating < 1 OR p_rating > 5 THEN
    RAISE EXCEPTION 'Rating must be 1–5';
  END IF;

  SELECT id, status, buyer_id, seller_id INTO v_deal
  FROM deals WHERE id = p_deal_id;

  IF v_deal.id IS NULL THEN
    RAISE EXCEPTION 'Deal not found';
  END IF;
  IF v_deal.buyer_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Only the buyer can review';
  END IF;
  IF v_deal.status IS DISTINCT FROM 'completed' THEN
    RAISE EXCEPTION 'Deal must be completed';
  END IF;
  IF EXISTS (SELECT 1 FROM deal_reviews WHERE deal_id = p_deal_id) THEN
    RAISE EXCEPTION 'Already reviewed';
  END IF;

  INSERT INTO deal_reviews (deal_id, reviewer_id, reviewee_id, rating, comment)
  VALUES (
    p_deal_id,
    auth.uid(),
    v_deal.seller_id,
    p_rating,
    NULLIF(trim(p_comment), '')
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION insert_deal_review(UUID, SMALLINT, TEXT) TO authenticated;

DROP POLICY IF EXISTS deal_reviews_insert ON deal_reviews;
