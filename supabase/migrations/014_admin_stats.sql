-- Admin platform stats (completed deals, fees, referral payouts)

CREATE OR REPLACE FUNCTION public.get_admin_platform_stats(
  p_granularity TEXT,
  p_bucket_count INT DEFAULT 30
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_trunc TEXT;
  v_count INT;
  v_start TIMESTAMPTZ;
  v_totals JSONB;
  v_buckets JSONB;
BEGIN
  v_count := GREATEST(1, LEAST(COALESCE(p_bucket_count, 30), 366));

  v_trunc := CASE lower(trim(p_granularity))
    WHEN 'day' THEN 'day'
    WHEN 'week' THEN 'week'
    WHEN 'month' THEN 'month'
    ELSE 'day'
  END;

  v_start := date_trunc(v_trunc, NOW()) - (
    CASE v_trunc
      WHEN 'day' THEN (v_count || ' days')::INTERVAL
      WHEN 'week' THEN (v_count || ' weeks')::INTERVAL
      WHEN 'month' THEN (v_count || ' months')::INTERVAL
    END
  );

  WITH buckets AS (
    SELECT generate_series(
      date_trunc(v_trunc, v_start),
      date_trunc(v_trunc, NOW()),
      ('1 ' || v_trunc)::INTERVAL
    ) AS period_start
  ),
  deal_stats AS (
    SELECT
      date_trunc(v_trunc, d.updated_at) AS period_start,
      COUNT(*)::BIGINT AS completed_deals,
      COALESCE(SUM(
        (d.amount_centavos * d.platform_fee_bps) / 10000
      ), 0)::BIGINT AS gross_fees_centavos
    FROM public.deals d
    WHERE d.status = 'completed'
      AND d.updated_at >= v_start
    GROUP BY 1
  ),
  referral_stats AS (
    SELECT
      date_trunc(v_trunc, rp.created_at) AS period_start,
      COALESCE(SUM(rp.amount_centavos), 0)::BIGINT AS referral_rewards_centavos
    FROM public.referral_payouts rp
    WHERE rp.created_at >= v_start
    GROUP BY 1
  ),
  merged AS (
    SELECT
      b.period_start,
      COALESCE(ds.completed_deals, 0)::BIGINT AS completed_deals,
      COALESCE(ds.gross_fees_centavos, 0)::BIGINT AS gross_fees_centavos,
      COALESCE(rs.referral_rewards_centavos, 0)::BIGINT AS referral_rewards_centavos
    FROM buckets b
    LEFT JOIN deal_stats ds ON ds.period_start = b.period_start
    LEFT JOIN referral_stats rs ON rs.period_start = b.period_start
  )
  SELECT
    jsonb_build_object(
      'completed_deals', COALESCE(SUM(m.completed_deals), 0),
      'gross_fees_centavos', COALESCE(SUM(m.gross_fees_centavos), 0),
      'referral_rewards_centavos', COALESCE(SUM(m.referral_rewards_centavos), 0),
      'net_revenue_centavos',
        COALESCE(SUM(m.gross_fees_centavos), 0) - COALESCE(SUM(m.referral_rewards_centavos), 0)
    ),
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'period_start', m.period_start,
          'completed_deals', m.completed_deals,
          'gross_fees_centavos', m.gross_fees_centavos,
          'referral_rewards_centavos', m.referral_rewards_centavos,
          'net_revenue_centavos',
            m.gross_fees_centavos - m.referral_rewards_centavos
        )
        ORDER BY m.period_start
      ),
      '[]'::JSONB
    )
  INTO v_totals, v_buckets
  FROM merged m;

  RETURN jsonb_build_object('totals', v_totals, 'buckets', v_buckets);
END;
$$;

REVOKE ALL ON FUNCTION public.get_admin_platform_stats(TEXT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_admin_platform_stats(TEXT, INT) TO service_role;
