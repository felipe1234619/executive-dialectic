-- JCE v0.2: run AFTER schema.sql on an isolated Supabase development database.
-- SECURITY DEFINER is deliberately in non-exposed schema; EXECUTE is denied by default.
-- A trusted server adapter must authenticate the session and execute this function
-- through a narrowly permissioned database connection. No client API is granted.
create or replace function jce_private.append_object_version(
 p_org uuid, p_decision uuid, p_object uuid, p_expected_revision bigint,
 p_idempotency_key text, p_body jsonb, p_origin text, p_verification text,
 p_reviewer uuid default null, p_verification_basis text default null
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
 v_actor uuid := auth.uid();
 v_decision_revision bigint;
 v_existing jce_private.audit_events%rowtype;
 v_kind text;
 v_sequence bigint;
 v_prior_digest text;
 v_digest text;
 v_payload jsonb;
 v_revision bigint;
begin
 if v_actor is null then raise exception 'Authentication required' using errcode='28000'; end if;
 if p_expected_revision is null or p_expected_revision < 0 or
    p_idempotency_key is null or length(trim(p_idempotency_key)) = 0 or
    p_body is null or jsonb_typeof(p_body) <> 'object' or
    p_origin not in ('HUMAN','MODEL_PROPOSAL') or
    p_verification not in ('UNASSESSED','PROVISIONAL','HUMAN_VERIFIED_WITH_SCOPE','DISPUTED','SUPERSEDED') then
   raise exception 'Invalid append request' using errcode='22023';
 end if;
 if not exists(select 1 from jce_private.memberships m
   where m.organization_id=p_org and m.user_id=v_actor and m.active
   and m.role in ('EDITOR','REVIEWER','AUTHORIZER','ADMIN')) then
   raise exception 'Not authorized for organization' using errcode='42501';
 end if;
 if p_verification='HUMAN_VERIFIED_WITH_SCOPE' then
   if p_origin <> 'HUMAN' or p_reviewer is distinct from v_actor or
      p_verification_basis is null or length(trim(p_verification_basis))=0 or
      not exists(select 1 from jce_private.memberships m where m.organization_id=p_org
        and m.user_id=v_actor and m.active and m.role in ('REVIEWER','AUTHORIZER','ADMIN')) then
      raise exception 'Verification requires an authorized human reviewer' using errcode='42501';
   end if;
 elsif p_reviewer is not null or p_verification_basis is not null then
   raise exception 'Reviewer metadata requires scoped verification' using errcode='22023';
 end if;
 -- Lock before idempotency lookup, serializing competing writers to this decision.
 select revision into v_decision_revision from jce_private.decisions
 where organization_id=p_org and id=p_decision for update;
 if not found then raise exception 'Decision not found' using errcode='P0002'; end if;
 select kind into v_kind from jce_private.decision_objects
 where organization_id=p_org and decision_id=p_decision and id=p_object;
 if not found then raise exception 'Object not found' using errcode='P0002'; end if;
 -- Store all meaningful request fields in canonical jsonb for replay comparison.
 -- WARNING: authenticated identity comes from auth.uid(); no p_actor parameter.
 v_payload := jsonb_build_object('object_id',p_object,'body',p_body,'origin',p_origin,
  'verification',p_verification,'reviewer',p_reviewer,'verification_basis',p_verification_basis);
 select * into v_existing from jce_private.audit_events
 where organization_id=p_org and decision_id=p_decision and idempotency_key=p_idempotency_key;
 if found then
   if v_existing.actor_id <> v_actor or v_existing.action <> 'APPEND_OBJECT_VERSION'
      or (v_existing.payload - 'sequence') <> v_payload then
     raise exception 'Idempotency key conflict' using errcode='23505';
   end if;
   return jsonb_build_object('revision',v_existing.revision,'sequence',
      (v_existing.payload->>'sequence')::bigint,'replayed',true);
 end if;
 if v_decision_revision <> p_expected_revision then
   raise exception 'Stale revision: expected %, actual %',p_expected_revision,v_decision_revision
      using errcode='40001';
 end if;
 select coalesce(max(sequence),0)+1 into v_sequence from jce_private.object_versions
 where organization_id=p_org and decision_id=p_decision and object_id=p_object;
 v_payload := v_payload || jsonb_build_object('sequence',v_sequence);
 -- This insert and audit insert belong to the SAME transaction. Any exception rolls both back.
 insert into jce_private.object_versions(organization_id,decision_id,object_id,sequence,body,
  origin,verification,reviewer_id,verification_basis,created_by)
 values(p_org,p_decision,p_object,v_sequence,p_body,p_origin,p_verification,
  p_reviewer,p_verification_basis,v_actor);
 select digest into v_prior_digest from jce_private.audit_events
 where organization_id=p_org and decision_id=p_decision and revision=v_decision_revision;
 if v_decision_revision>0 and v_prior_digest is null then
   raise exception 'Broken audit chain' using errcode='23514';
 end if;
 v_revision:=v_decision_revision+1;
 v_digest:=encode(sha256(convert_to(
   coalesce(v_prior_digest,'GENESIS')||':'||p_org::text||':'||p_decision::text||':'||
   v_revision::text||':'||v_actor::text||':'||p_idempotency_key||':'||
   'APPEND_OBJECT_VERSION'||':'||v_payload::text,'UTF8')),'hex');
 insert into jce_private.audit_events(organization_id,decision_id,revision,
  idempotency_key,actor_id,action,payload,prior_digest,digest)
 values(p_org,p_decision,v_revision,p_idempotency_key,v_actor,
  'APPEND_OBJECT_VERSION',v_payload,v_prior_digest,v_digest);
 update jce_private.decisions set revision=v_revision
 where organization_id=p_org and id=p_decision;
 return jsonb_build_object('revision',v_revision,'sequence',v_sequence,'replayed',false);
end $$;
revoke all on function jce_private.append_object_version(uuid,uuid,uuid,bigint,text,jsonb,text,text,uuid,text)
 from public, anon, authenticated, service_role;
-- Grant only after a separately audited, authenticated adapter is available.
