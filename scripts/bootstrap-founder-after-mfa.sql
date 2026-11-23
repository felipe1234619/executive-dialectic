-- Executive Dialectic™ founder bootstrap ceremony.
-- DO NOT RUN until the founder has a current verified Supabase Auth session AND
-- at least one verified MFA factor. Intended for the shared production project
-- only after independent review. All constitutional changes are one transaction.
\set ON_ERROR_STOP on
BEGIN;
SET LOCAL statement_timeout='15s';

DO $preflight$
DECLARE
  v_user uuid := '471d6599-16ac-40dd-bca5-06bcd52fec28';
  v_email text;
  v_confirmed timestamptz;
  v_mfa bigint;
BEGIN
  SELECT email,email_confirmed_at INTO v_email,v_confirmed FROM auth.users WHERE id=v_user;
  IF v_email IS DISTINCT FROM 'felipe.carval@proton.me' OR v_confirmed IS NULL THEN
    RAISE EXCEPTION 'Founder Auth identity is not the approved confirmed identity';
  END IF;
  SELECT count(*) INTO v_mfa FROM auth.mfa_factors WHERE user_id=v_user AND status='verified';
  IF v_mfa < 1 THEN RAISE EXCEPTION 'Verified MFA factor required before founder bootstrap'; END IF;
END
$preflight$;

INSERT INTO jce_private.organizations(id,name)
VALUES ('4aa1acf7-482e-4110-a324-cfa1c874ab68','Executive Dialectic')
ON CONFLICT (id) DO NOTHING;

DO $integrity$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM jce_private.organizations
    WHERE id='4aa1acf7-482e-4110-a324-cfa1c874ab68' AND name='Executive Dialectic'
  ) THEN RAISE EXCEPTION 'Organization bootstrap identity conflict'; END IF;
END
$integrity$;

INSERT INTO jce_private.memberships(organization_id,user_id,role,active)
VALUES (
 '4aa1acf7-482e-4110-a324-cfa1c874ab68',
 '471d6599-16ac-40dd-bca5-06bcd52fec28',
 'ADMIN',true
)
ON CONFLICT (organization_id,user_id) DO NOTHING;

DO $membership_integrity$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM jce_private.memberships
    WHERE organization_id='4aa1acf7-482e-4110-a324-cfa1c874ab68'
      AND user_id='471d6599-16ac-40dd-bca5-06bcd52fec28'
      AND role='ADMIN' AND active
  ) THEN RAISE EXCEPTION 'Founder membership conflict'; END IF;
END
$membership_integrity$;

INSERT INTO jce_private.decisions(organization_id,id,title,revision)
VALUES (
 '4aa1acf7-482e-4110-a324-cfa1c874ab68',
 'f38076a7-25c6-4abb-91fe-3b86dc400596',
 'Founding Authority and Institutional Identity',0
)
ON CONFLICT (organization_id,id) DO NOTHING;

SELECT jce_private.append_audit_event(
 '4aa1acf7-482e-4110-a324-cfa1c874ab68',
 'f38076a7-25c6-4abb-91fe-3b86dc400596',
 '471d6599-16ac-40dd-bca5-06bcd52fec28',
 (SELECT revision FROM jce_private.decisions
  WHERE organization_id='4aa1acf7-482e-4110-a324-cfa1c874ab68'
    AND id='f38076a7-25c6-4abb-91fe-3b86dc400596'),
 'founder-bootstrap-v1',
 'FOUNDING_AUTHORITY_ESTABLISHED',
 jsonb_build_object(
   'organization_name','Executive Dialectic',
   'legal_posture','founder acting as natural person; no incorporated entity asserted',
   'institutional_title','Founding Administrator',
   'database_role','ADMIN',
   'identity_source','Supabase Auth confirmed user + verified MFA',
   'historical_rule','future ownership changes must not rewrite founding authorship'
 )
);

COMMIT;
