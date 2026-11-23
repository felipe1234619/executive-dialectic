-- JCE behavioral regression in a freshly created PostgreSQL 17 scratch database.
-- Only fictional fixtures. All changes rolled back. Auth is a LOCAL MOCK.
\set ON_ERROR_STOP on
BEGIN;
SET LOCAL statement_timeout = '15s';
INSERT INTO auth.users(id) VALUES
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
 ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
INSERT INTO jce_private.organizations(id,name) VALUES
 ('11111111-1111-4111-8111-111111111111','Fixture A'),
 ('22222222-2222-4222-8222-222222222222','Fixture B');
INSERT INTO jce_private.memberships(organization_id,user_id,role) VALUES
 ('11111111-1111-4111-8111-111111111111','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','EDITOR'),
 ('22222222-2222-4222-8222-222222222222','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','EDITOR');
INSERT INTO jce_private.decisions(organization_id,id,title,revision) VALUES
 ('11111111-1111-4111-8111-111111111111','33333333-3333-4333-8333-333333333333','Append',0),
 ('11111111-1111-4111-8111-111111111111','44444444-4444-4444-8444-444444444444','Broken chain',1),
 ('22222222-2222-4222-8222-222222222222','55555555-5555-4555-8555-555555555555','Tenant B',0),
 ('11111111-1111-4111-8111-111111111111','66666666-6666-4666-8666-666666666666','Reviewer',0);
INSERT INTO jce_private.decision_objects(organization_id,decision_id,id,kind) VALUES
 ('11111111-1111-4111-8111-111111111111','33333333-3333-4333-8333-333333333333','88888888-8888-4888-8888-888888888888','CLAIM'),
 ('11111111-1111-4111-8111-111111111111','44444444-4444-4444-8444-444444444444','99999999-9999-4999-8999-999999999999','CLAIM'),
 ('22222222-2222-4222-8222-222222222222','55555555-5555-4555-8555-555555555555','cccccccc-cccc-4ccc-8ccc-cccccccccccc','CLAIM'),
 ('11111111-1111-4111-8111-111111111111','66666666-6666-4666-8666-666666666666','dddddddd-dddd-4ddd-8ddd-dddddddddddd','CLAIM');
SET LOCAL "request.jwt.claim.sub" = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
DO $test$
DECLARE r jsonb; n bigint; msg text;
BEGIN
 SELECT jce_private.append_object_version(
  '11111111-1111-4111-8111-111111111111','33333333-3333-4333-8333-333333333333',
  '88888888-8888-4888-8888-888888888888',0,'key-1',
  '{"fact":"first"}','HUMAN','UNASSESSED') INTO r;
 IF r<> '{"revision":1,"sequence":1,"replayed":false}'::jsonb
 THEN RAISE EXCEPTION 'FAIL initial append: %',r; END IF;
 SELECT count(*) INTO n FROM jce_private.audit_events
 WHERE decision_id='33333333-3333-4333-8333-333333333333';
 IF n<>1 THEN RAISE EXCEPTION 'FAIL initial audit count'; END IF;
 RAISE NOTICE 'PASS 01 atomic append';

 SELECT jce_private.append_object_version(
  '11111111-1111-4111-8111-111111111111','33333333-3333-4333-8333-333333333333',
  '88888888-8888-4888-8888-888888888888',0,'key-1',
  '{"fact":"first"}','HUMAN','UNASSESSED') INTO r;
 IF r<> '{"revision":1,"sequence":1,"replayed":true}'::jsonb
 THEN RAISE EXCEPTION 'FAIL idempotent replay: %',r; END IF;
 BEGIN
  PERFORM jce_private.append_object_version(
   '11111111-1111-4111-8111-111111111111','33333333-3333-4333-8333-333333333333',
   '88888888-8888-4888-8888-888888888888',0,'key-1',
   '{"fact":"changed"}','HUMAN','UNASSESSED');
  RAISE EXCEPTION 'FAIL conflicting idempotency accepted';
 EXCEPTION WHEN OTHERS THEN
  GET STACKED DIAGNOSTICS msg = MESSAGE_TEXT;
  IF msg <> 'Idempotency key conflict' THEN RAISE; END IF;
 END;
 RAISE NOTICE 'PASS 01B idempotent replay and conflict';

 BEGIN
  PERFORM jce_private.append_object_version(
   '11111111-1111-4111-8111-111111111111','33333333-3333-4333-8333-333333333333',
   '88888888-8888-4888-8888-888888888888',0,'key-stale',
   '{"fact":"stale"}','HUMAN','UNASSESSED');
  RAISE EXCEPTION 'FAIL stale revision accepted';
 EXCEPTION WHEN serialization_failure THEN NULL;
 END;
 RAISE NOTICE 'PASS 04 stale revision rejected';

 SELECT jce_private.append_object_version(
  '11111111-1111-4111-8111-111111111111','33333333-3333-4333-8333-333333333333',
  '88888888-8888-4888-8888-888888888888',1,'key-2',
  '{"fact":"second"}','HUMAN','PROVISIONAL') INTO r;
 IF r<> '{"revision":2,"sequence":2,"replayed":false}'::jsonb
 THEN RAISE EXCEPTION 'FAIL second append: %',r; END IF;
 IF NOT EXISTS (
  SELECT 1 FROM jce_private.audit_events a1 JOIN jce_private.audit_events a2
   ON a1.organization_id=a2.organization_id AND a1.decision_id=a2.decision_id
  WHERE a1.decision_id='33333333-3333-4333-8333-333333333333'
   AND a1.revision=1 AND a2.revision=2 AND a2.prior_digest=a1.digest
 ) THEN RAISE EXCEPTION 'FAIL audit digest linkage'; END IF;
 RAISE NOTICE 'PASS 01C sequential revisions and audit digest linkage';

 BEGIN
  PERFORM jce_private.append_object_version(
   '11111111-1111-4111-8111-111111111111','44444444-4444-4444-8444-444444444444',
   '99999999-9999-4999-8999-999999999999',1,'broken',
   '{"fact":"broken"}','HUMAN','UNASSESSED');
  RAISE EXCEPTION 'FAIL broken audit chain accepted';
 EXCEPTION WHEN OTHERS THEN
  GET STACKED DIAGNOSTICS msg = MESSAGE_TEXT;
  IF msg <> 'Broken audit chain' THEN RAISE; END IF;
 END;
 SELECT count(*) INTO n FROM jce_private.object_versions
 WHERE decision_id='44444444-4444-4444-8444-444444444444';
 IF n<>0 THEN RAISE EXCEPTION 'FAIL broken chain left a version'; END IF;
 RAISE NOTICE 'PASS 02 broken chain rolls back version';

 BEGIN
  PERFORM jce_private.append_object_version(
   '22222222-2222-4222-8222-222222222222','55555555-5555-4555-8555-555555555555',
   'cccccccc-cccc-4ccc-8ccc-cccccccccccc',0,'cross',
   '{"fact":"cross"}','HUMAN','UNASSESSED');
  RAISE EXCEPTION 'FAIL cross-tenant write accepted';
 EXCEPTION WHEN OTHERS THEN
  GET STACKED DIAGNOSTICS msg = MESSAGE_TEXT;
  IF msg <> 'Not authorized for organization' THEN RAISE; END IF;
 END;
 RAISE NOTICE 'PASS 03 cross-tenant write rejected';

 BEGIN
  PERFORM jce_private.append_object_version(
   '11111111-1111-4111-8111-111111111111','66666666-6666-4666-8666-666666666666',
   'dddddddd-dddd-4ddd-8ddd-dddddddddddd',0,'review',
   '{"fact":"review"}','HUMAN','HUMAN_VERIFIED_WITH_SCOPE',
   'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Reviewed');
  RAISE EXCEPTION 'FAIL editor issued scoped human verification';
 EXCEPTION WHEN OTHERS THEN
  GET STACKED DIAGNOSTICS msg = MESSAGE_TEXT;
  IF msg <> 'Verification requires an authorized human reviewer' THEN RAISE; END IF;
 END;
 RAISE NOTICE 'PASS reviewer authorization boundaries';
END
$test$;

SET LOCAL ROLE jce_executor;
DO $rls$
DECLARE n bigint;
BEGIN
 SELECT count(*) INTO n FROM jce_private.decisions
 WHERE organization_id='22222222-2222-4222-8222-222222222222';
 IF n<>0 THEN RAISE EXCEPTION 'FAIL cross-tenant decision visible'; END IF;
 SELECT count(*) INTO n FROM jce_private.decisions
 WHERE organization_id='11111111-1111-4111-8111-111111111111';
 IF n<>3 THEN RAISE EXCEPTION 'FAIL own decision count: %',n; END IF;
 SELECT count(*) INTO n FROM jce_private.object_versions
 WHERE decision_id='33333333-3333-4333-8333-333333333333';
 IF n<>2 THEN RAISE EXCEPTION 'FAIL own version count: %',n; END IF;
 RAISE NOTICE 'PASS 03B executor RLS tenant isolation';
END
$rls$;
RESET ROLE;

DO $immut$
DECLARE tbl text; op text; msg text; n bigint;
BEGIN
 FOREACH tbl IN ARRAY ARRAY['object_versions','audit_events'] LOOP
  FOREACH op IN ARRAY ARRAY['UPDATE','DELETE'] LOOP
   BEGIN
    IF tbl='object_versions' THEN
     IF op='UPDATE' THEN
      UPDATE jce_private.object_versions SET body='{"tampered":true}'
      WHERE decision_id='33333333-3333-4333-8333-333333333333' AND sequence=1;
     ELSE
      DELETE FROM jce_private.object_versions
      WHERE decision_id='33333333-3333-4333-8333-333333333333' AND sequence=1;
     END IF;
    ELSE
     IF op='UPDATE' THEN
      UPDATE jce_private.audit_events SET action='TAMPERED'
      WHERE decision_id='33333333-3333-4333-8333-333333333333' AND revision=1;
     ELSE
      DELETE FROM jce_private.audit_events
      WHERE decision_id='33333333-3333-4333-8333-333333333333' AND revision=1;
     END IF;
    END IF;
    RAISE EXCEPTION 'FAIL mutation accepted: % %',op,tbl;
   EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS msg = MESSAGE_TEXT;
    IF msg <> 'JCE historical records are append-only' THEN RAISE; END IF;
   END;
   RAISE NOTICE 'PASS 05B % rejected on %',op,tbl;
  END LOOP;
 END LOOP;
 SELECT count(*) INTO n FROM jce_private.audit_events
 WHERE decision_id='33333333-3333-4333-8333-333333333333';
 IF n<>2 THEN RAISE EXCEPTION 'FAIL audit history count after mutation tests'; END IF;
 SELECT count(*) INTO n FROM jce_private.object_versions
 WHERE decision_id='33333333-3333-4333-8333-333333333333';
 IF n<>2 THEN RAISE EXCEPTION 'FAIL version history count after mutation tests'; END IF;
 RAISE NOTICE 'PASS 05B historical integrity preserved';
END
$immut$;
ROLLBACK;
\echo 'PASS: JCE behavioral regression completed and fixtures rolled back'
