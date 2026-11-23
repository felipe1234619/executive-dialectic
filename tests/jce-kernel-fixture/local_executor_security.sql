-- JCE local research ONLY. Apply to jce_constitutional_test, not production.
-- This grants the internal executor only the table operations used by the append function.
\set ON_ERROR_STOP on
BEGIN;
GRANT USAGE, CREATE ON SCHEMA jce_private TO jce_executor;
GRANT USAGE ON SCHEMA auth TO jce_executor;
GRANT EXECUTE ON FUNCTION auth.uid() TO jce_executor;
GRANT SELECT ON jce_private.memberships TO jce_executor;
GRANT SELECT, UPDATE (revision) ON jce_private.decisions TO jce_executor;
GRANT SELECT ON jce_private.decision_objects TO jce_executor;
GRANT SELECT, INSERT ON jce_private.object_versions TO jce_executor;
GRANT SELECT, INSERT ON jce_private.audit_events TO jce_executor;

-- The executor can see only membership records matching the session identity.
CREATE POLICY jce_executor_membership_read ON jce_private.memberships
  FOR SELECT TO jce_executor USING (user_id = auth.uid() AND active);
CREATE POLICY jce_executor_decision_read ON jce_private.decisions
  FOR SELECT TO jce_executor USING (
    EXISTS (SELECT 1 FROM jce_private.memberships m
      WHERE m.organization_id = decisions.organization_id AND m.user_id = auth.uid()
      AND m.active AND m.role IN ('EDITOR','REVIEWER','AUTHORIZER','ADMIN')));
CREATE POLICY jce_executor_decision_update ON jce_private.decisions
  FOR UPDATE TO jce_executor
  USING (EXISTS (SELECT 1 FROM jce_private.memberships m
    WHERE m.organization_id = decisions.organization_id AND m.user_id = auth.uid()
    AND m.active AND m.role IN ('EDITOR','REVIEWER','AUTHORIZER','ADMIN')))
  WITH CHECK (EXISTS (SELECT 1 FROM jce_private.memberships m
    WHERE m.organization_id = decisions.organization_id AND m.user_id = auth.uid()
    AND m.active AND m.role IN ('EDITOR','REVIEWER','AUTHORIZER','ADMIN')));
CREATE POLICY jce_executor_object_read ON jce_private.decision_objects
  FOR SELECT TO jce_executor USING (
    EXISTS (SELECT 1 FROM jce_private.memberships m
      WHERE m.organization_id = decision_objects.organization_id AND m.user_id = auth.uid()
      AND m.active AND m.role IN ('EDITOR','REVIEWER','AUTHORIZER','ADMIN')));
CREATE POLICY jce_executor_version_read ON jce_private.object_versions
  FOR SELECT TO jce_executor USING (
    EXISTS (SELECT 1 FROM jce_private.memberships m
      WHERE m.organization_id = object_versions.organization_id AND m.user_id = auth.uid()
      AND m.active AND m.role IN ('EDITOR','REVIEWER','AUTHORIZER','ADMIN')));
CREATE POLICY jce_executor_version_insert ON jce_private.object_versions
  FOR INSERT TO jce_executor WITH CHECK (
    created_by = auth.uid() AND
    EXISTS (SELECT 1 FROM jce_private.memberships m
      WHERE m.organization_id = object_versions.organization_id AND m.user_id = auth.uid()
      AND m.active AND m.role IN ('EDITOR','REVIEWER','AUTHORIZER','ADMIN')));
CREATE POLICY jce_executor_audit_read ON jce_private.audit_events
  FOR SELECT TO jce_executor USING (
    EXISTS (SELECT 1 FROM jce_private.memberships m
      WHERE m.organization_id = audit_events.organization_id AND m.user_id = auth.uid()
      AND m.active AND m.role IN ('EDITOR','REVIEWER','AUTHORIZER','ADMIN')));
CREATE POLICY jce_executor_audit_insert ON jce_private.audit_events
  FOR INSERT TO jce_executor WITH CHECK (
    actor_id = auth.uid() AND
    EXISTS (SELECT 1 FROM jce_private.memberships m
      WHERE m.organization_id = audit_events.organization_id AND m.user_id = auth.uid()
      AND m.active AND m.role IN ('EDITOR','REVIEWER','AUTHORIZER','ADMIN')));

-- Transfer SECURITY DEFINER ownership away from superuser.
ALTER FUNCTION jce_private.append_object_version(uuid,uuid,uuid,bigint,text,jsonb,text,text,uuid,text)
  OWNER TO jce_executor;
REVOKE CREATE ON SCHEMA jce_private FROM jce_executor;
-- No client roles receive schema usage or function execute permission.
REVOKE ALL ON FUNCTION jce_private.append_object_version(uuid,uuid,uuid,bigint,text,jsonb,text,text,uuid,text)
  FROM PUBLIC, anon, authenticated, service_role;
COMMIT;

SELECT p.proname, pg_get_userbyid(p.proowner) AS owner, p.prosecdef AS security_definer
FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname='jce_private' AND p.proname='append_object_version';
SELECT tablename, policyname FROM pg_policies WHERE schemaname='jce_private' ORDER BY tablename,policyname;
