\set ON_ERROR_STOP on
SELECT 1 / (current_database() LIKE 'jce_repro_%')::int;
BEGIN;

INSERT INTO auth.users(id) VALUES
 ('a0000000-0000-0000-0000-000000000001'),
 ('a0000000-0000-0000-0000-000000000002');
INSERT INTO jce_private.organizations(id,name) VALUES
 ('b0000000-0000-0000-0000-000000000001','Membership audit A'),
 ('b0000000-0000-0000-0000-000000000002','Membership audit B');
INSERT INTO jce_private.memberships(organization_id,user_id,role,active) VALUES
 ('b0000000-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000001','ADMIN',true),
 ('b0000000-0000-0000-0000-000000000002','a0000000-0000-0000-0000-000000000001','ADMIN',false),
 ('b0000000-0000-0000-0000-000000000002','a0000000-0000-0000-0000-000000000002','READER',true);

SELECT 1 / (NOT has_function_privilege('anon','public.executive_dialectic_current_membership(uuid)','EXECUTE'))::int;
SELECT 1 / (NOT has_function_privilege('service_role','public.executive_dialectic_current_membership(uuid)','EXECUTE'))::int;
SELECT 1 / (NOT has_table_privilege('authenticated','jce_private.memberships','SELECT'))::int;
SELECT 1 / (NOT has_schema_privilege('jce_executor','public','CREATE'))::int;

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims','{"aal":"aal2","sub":"a0000000-0000-0000-0000-000000000001"}',true);
SELECT 1 / (public.executive_dialectic_current_membership('b0000000-0000-0000-0000-000000000001') IS NOT DISTINCT FROM 'ADMIN')::int;
SELECT 1 / (public.executive_dialectic_current_membership('b0000000-0000-0000-0000-000000000002') IS NULL)::int;

SELECT set_config('request.jwt.claims','{"aal":"aal2","sub":"a0000000-0000-0000-0000-000000000002"}',true);
SELECT 1 / (public.executive_dialectic_current_membership('b0000000-0000-0000-0000-000000000001') IS NULL)::int;
SELECT 1 / (public.executive_dialectic_current_membership('b0000000-0000-0000-0000-000000000002') IS NOT DISTINCT FROM 'READER')::int;

SELECT set_config('request.jwt.claims','{"aal":"aal1","sub":"a0000000-0000-0000-0000-000000000002"}',true);
SELECT 1 / (public.executive_dialectic_current_membership('b0000000-0000-0000-0000-000000000002') IS NULL)::int;
SELECT set_config('request.jwt.claims','{}',true);
SELECT 1 / (public.executive_dialectic_current_membership('b0000000-0000-0000-0000-000000000002') IS NULL)::int;
ROLLBACK;
