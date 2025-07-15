
-- Criar função SQL para estatísticas do admin
CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS TABLE(
  total_petitions bigint,
  total_users bigint,
  pending_petitions bigint,
  distribution_by_status json
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  WITH petition_counts AS (
    SELECT status, count(*) as cnt
    FROM public.petitions
    GROUP BY status
  )
  SELECT
    (SELECT count(*) FROM public.petitions) as total_petitions,
    (SELECT count(*) FROM public.profiles WHERE is_admin = false) as total_users,
    (SELECT count(*) FROM public.petitions WHERE status = 'pending') as pending_petitions,
    COALESCE(json_object_agg(status, cnt), '{}'::json) as distribution_by_status
  FROM petition_counts;
$$;
