-- Read the caller's active role for one organization through the existing RLS policy.
-- Deployment requires an isolated integration test before use in the shared project.
BEGIN;

GRANT USAGE ON SCHEMA auth TO jce_executor;
GRANT CREATE ON SCHEMA public TO jce_executor;

CREATE FUNCTION public.executive_dialectic_current_membership(p_organization_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $membership$
  SELECT membership.role::text
  FROM jce_private.memberships AS membership
  WHERE p_organization_id IS NOT NULL
    AND auth.jwt() ->> 'aal' = 'aal2'
    AND membership.organization_id = p_organization_id
    AND membership.user_id = auth.uid()
    AND membership.active;
$membership$;

ALTER FUNCTION public.executive_dialectic_current_membership(uuid) OWNER TO jce_executor;
REVOKE CREATE ON SCHEMA public FROM jce_executor;
REVOKE ALL ON FUNCTION public.executive_dialectic_current_membership(uuid)
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.executive_dialectic_current_membership(uuid)
  TO authenticated;

COMMIT;
