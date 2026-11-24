-- Read the caller's active role through a dedicated, read-only RLS policy.
-- Deployment requires an isolated integration test before use in the shared project.
BEGIN;

CREATE ROLE dialectic_membership_reader NOLOGIN NOINHERIT NOBYPASSRLS;
GRANT dialectic_membership_reader TO CURRENT_USER WITH SET TRUE, INHERIT FALSE;
GRANT USAGE ON SCHEMA auth, jce_private TO dialectic_membership_reader;
GRANT EXECUTE ON FUNCTION auth.uid(), auth.jwt() TO dialectic_membership_reader;
GRANT SELECT (organization_id, user_id, role, active)
  ON jce_private.memberships TO dialectic_membership_reader;

CREATE POLICY dialectic_membership_reader_self ON jce_private.memberships
  FOR SELECT TO dialectic_membership_reader
  USING (user_id = auth.uid() AND active);
GRANT CREATE ON SCHEMA public TO dialectic_membership_reader;

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

ALTER FUNCTION public.executive_dialectic_current_membership(uuid) OWNER TO dialectic_membership_reader;
REVOKE CREATE ON SCHEMA public FROM dialectic_membership_reader;
REVOKE SET OPTION FOR dialectic_membership_reader FROM CURRENT_USER;
REVOKE ALL ON FUNCTION public.executive_dialectic_current_membership(uuid)
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.executive_dialectic_current_membership(uuid)
  TO authenticated;

DO $verify$
BEGIN
  IF NOT has_schema_privilege('dialectic_membership_reader', 'auth', 'USAGE')
    OR NOT has_schema_privilege('dialectic_membership_reader', 'jce_private', 'USAGE')
    OR NOT has_function_privilege('dialectic_membership_reader', 'auth.uid()', 'EXECUTE')
    OR NOT has_function_privilege('dialectic_membership_reader', 'auth.jwt()', 'EXECUTE')
    OR NOT has_column_privilege('dialectic_membership_reader', 'jce_private.memberships', 'role', 'SELECT')
    OR has_schema_privilege('dialectic_membership_reader', 'public', 'CREATE')
  THEN
    RAISE EXCEPTION 'Membership reader privileges do not match the expected configuration';
  END IF;
END
$verify$;

COMMIT;
