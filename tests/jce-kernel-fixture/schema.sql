-- JCE Constitutional Persistence v0.1. Private, deny-by-default research schema.
-- No grants to anon/authenticated/service_role; no API exposure or production integration.
create schema if not exists jce_private;
revoke all on schema jce_private from public, anon, authenticated, service_role;

create table if not exists jce_private.organizations (
 id uuid primary key default gen_random_uuid(), name text not null check (length(trim(name)) > 0), created_at timestamptz not null default now()
);
create table if not exists jce_private.memberships (
 organization_id uuid not null references jce_private.organizations(id), user_id uuid not null references auth.users(id),
 role text not null check (role in ('READER','EDITOR','REVIEWER','AUTHORIZER','ADMIN')),
 active boolean not null default true, primary key(organization_id,user_id)
);
create table if not exists jce_private.decisions (
 organization_id uuid not null references jce_private.organizations(id), id uuid not null default gen_random_uuid(),
 title text not null, revision bigint not null default 0 check(revision>=0),
 created_at timestamptz not null default now(), primary key(organization_id,id)
);
create table if not exists jce_private.decision_objects (
 organization_id uuid not null, decision_id uuid not null, id uuid not null default gen_random_uuid(),
 kind text not null check(kind in ('ASSUMPTION','OPPOSITION','FRAME','CLAIM','ALTERNATIVE','CONSEQUENCE','JUDGMENT','DISSENT','REVISION_TRIGGER')),
 created_at timestamptz not null default now(), primary key(organization_id,decision_id,id),
 foreign key(organization_id,decision_id) references jce_private.decisions(organization_id,id)
);
create table if not exists jce_private.evidence (
 organization_id uuid not null, decision_id uuid not null, id uuid not null default gen_random_uuid(),
 source text not null, locator text not null, content_sha256 text not null check(content_sha256 ~ '^[a-f0-9]{64}$'),
 created_by uuid not null references auth.users(id), created_at timestamptz not null default now(),
 primary key(organization_id,decision_id,id),
 foreign key(organization_id,decision_id) references jce_private.decisions(organization_id,id)
);
create table if not exists jce_private.object_versions (
 organization_id uuid not null, decision_id uuid not null, object_id uuid not null,
 sequence bigint not null check(sequence>=1), body jsonb not null check(jsonb_typeof(body)='object'),
 origin text not null check(origin in ('HUMAN','MODEL_PROPOSAL')),
 verification text not null check(verification in ('UNASSESSED','PROVISIONAL','HUMAN_VERIFIED_WITH_SCOPE','DISPUTED','SUPERSEDED')),
 reviewer_id uuid references auth.users(id), verification_basis text,
 created_by uuid not null references auth.users(id), created_at timestamptz not null default now(),
 primary key(organization_id,decision_id,object_id,sequence),
 foreign key(organization_id,decision_id,object_id) references jce_private.decision_objects(organization_id,decision_id,id),
 check(verification <> 'HUMAN_VERIFIED_WITH_SCOPE' or (origin='HUMAN' and reviewer_id is not null and length(trim(verification_basis))>0))
);
create table if not exists jce_private.relations (
 organization_id uuid not null, decision_id uuid not null, id uuid not null default gen_random_uuid(),
 from_object_id uuid not null, to_object_id uuid not null, relation_type text not null,
 rationale text not null check(length(trim(rationale))>0), reviewed_by uuid references auth.users(id),
 created_by uuid not null references auth.users(id), created_at timestamptz not null default now(),
 primary key(organization_id,decision_id,id),
 foreign key(organization_id,decision_id,from_object_id) references jce_private.decision_objects(organization_id,decision_id,id),
 foreign key(organization_id,decision_id,to_object_id) references jce_private.decision_objects(organization_id,decision_id,id),
 check(from_object_id<>to_object_id),
 check(relation_type in ('DEPENDS_ON','SUPPORTS','CHALLENGES','CONTRADICTS','INTERPRETS','CONCERNS_PARTY','IMPLICATES_CONSEQUENCE','CONDITIONS_AUTHORIZATION','SUPERSEDES','TRIGGERS_REVIEW','IMPLEMENTS_ALTERNATIVE'))
);
create table if not exists jce_private.audit_events (
 organization_id uuid not null, decision_id uuid not null, revision bigint not null check(revision>0),
 event_id uuid not null default gen_random_uuid(), idempotency_key text not null check(length(trim(idempotency_key))>0),
 actor_id uuid not null references auth.users(id), action text not null, payload jsonb not null,
 prior_digest text, digest text not null check(digest ~ '^[a-f0-9]{64}$'),
 recorded_at timestamptz not null default now(),
 primary key(organization_id,decision_id,revision),
 unique(organization_id,decision_id,idempotency_key),
 foreign key(organization_id,decision_id) references jce_private.decisions(organization_id,id)
);
-- Immutable record tables. Revocation of DML is primary; triggers protect accidental privileged edits.
create or replace function jce_private.reject_mutation() returns trigger language plpgsql set search_path = '' as $$
begin raise exception 'JCE historical records are append-only'; end $$;
revoke all on function jce_private.reject_mutation() from public, anon, authenticated, service_role;
do $$ declare t text; begin
 foreach t in array array['evidence','object_versions','relations','audit_events'] loop
  execute format('drop trigger if exists jce_immutable on jce_private.%I',t);
  execute format('create trigger jce_immutable before update or delete on jce_private.%I for each row execute function jce_private.reject_mutation()',t);
 end loop;
end $$;
-- Enable and force RLS for defense in depth; no client policies and no client grants.
do $$ declare t text; begin
 foreach t in array array['organizations','memberships','decisions','decision_objects','evidence','object_versions','relations','audit_events'] loop
  execute format('alter table jce_private.%I enable row level security',t);
  execute format('alter table jce_private.%I force row level security',t);
  execute format('revoke all on jce_private.%I from public, anon, authenticated, service_role',t);
 end loop;
end $$;
-- Write operations must be added as narrowly scoped, authenticated, transactional functions
-- with explicit membership checks and optimistic compare-and-swap. None exposed in v0.1.

-- Privileged, private transaction boundary. NOT granted to web-facing roles.
-- Uses row-level locking, expected revision and stable idempotency key.
-- The database role must be deliberately provisioned; RLS FORCE denies ordinary owners.
create or replace function jce_private.append_audit_event(
 p_org uuid, p_decision uuid, p_actor uuid, p_expected_revision bigint,
 p_key text, p_action text, p_payload jsonb
) returns bigint language plpgsql security invoker set search_path = '' as $$
declare v_revision bigint; v_prior text; v_existing record; v_digest text;
begin
 if p_actor is null or p_key is null or length(trim(p_key))=0 or p_action is null or p_payload is null then
  raise exception 'Invalid audit request';
 end if;
 -- This function is only for trusted transaction callers; actor identity must be
 -- bound to a verified session by the future server-side adapter, not user input.
 if not exists(select 1 from jce_private.memberships m
  where m.organization_id=p_org and m.user_id=p_actor and m.active
    and m.role in ('EDITOR','REVIEWER','AUTHORIZER','ADMIN')) then
  raise exception 'Actor is not authorized for this organization';
 end if;
 select d.revision into v_revision from jce_private.decisions d
  where d.organization_id=p_org and d.id=p_decision for update;
 if not found then raise exception 'Decision not found in organization'; end if;
 select a.revision, a.action, a.payload, a.actor_id into v_existing
 from jce_private.audit_events a
 where a.organization_id=p_org and a.decision_id=p_decision and a.idempotency_key=p_key;
 if found then
  if v_existing.action<>p_action or v_existing.payload<>p_payload or v_existing.actor_id<>p_actor then
   raise exception 'Idempotency key reused with different content';
  end if;
  return v_existing.revision;
 end if;
 if v_revision<>p_expected_revision then
  raise exception 'Stale revision: expected %, actual %',p_expected_revision,v_revision using errcode='40001';
 end if;
 select a.digest into v_prior from jce_private.audit_events a
 where a.organization_id=p_org and a.decision_id=p_decision and a.revision=v_revision;
 if v_revision>0 and v_prior is null then raise exception 'Audit chain is incomplete'; end if;
 v_digest=encode(sha256(convert_to(
   coalesce(v_prior,'GENESIS')||':'||p_org::text||':'||p_decision::text||':'||
   (v_revision+1)::text||':'||p_actor::text||':'||p_key||':'||p_action||':'||p_payload::text,
   'UTF8')),'hex');
 insert into jce_private.audit_events(organization_id,decision_id,revision,idempotency_key,actor_id,action,payload,prior_digest,digest)
 values(p_org,p_decision,v_revision+1,p_key,p_actor,p_action,p_payload,v_prior,v_digest);
 update jce_private.decisions set revision=revision+1
 where organization_id=p_org and id=p_decision;
 return v_revision+1;
end $$;
revoke all on function jce_private.append_audit_event(uuid,uuid,uuid,bigint,text,text,jsonb) from public,anon,authenticated,service_role;
