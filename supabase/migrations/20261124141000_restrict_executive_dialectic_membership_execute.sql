BEGIN;
GRANT dialectic_membership_reader TO CURRENT_USER WITH SET TRUE, INHERIT FALSE;
SET LOCAL ROLE dialectic_membership_reader;
REVOKE ALL ON FUNCTION public.executive_dialectic_current_membership(uuid)
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.executive_dialectic_current_membership(uuid)
  TO authenticated;
RESET ROLE;
REVOKE SET OPTION FOR dialectic_membership_reader FROM CURRENT_USER;
DO $verify$
BEGIN
  IF has_function_privilege('anon','public.executive_dialectic_current_membership(uuid)','EXECUTE')
    OR has_function_privilege('service_role','public.executive_dialectic_current_membership(uuid)','EXECUTE')
    OR NOT has_function_privilege('authenticated','public.executive_dialectic_current_membership(uuid)','EXECUTE')
  THEN RAISE EXCEPTION 'Unexpected membership RPC grants'; END IF;
END
$verify$;
COMMIT;