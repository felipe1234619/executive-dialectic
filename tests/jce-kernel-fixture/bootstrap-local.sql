-- JCE local-only bootstrap. Never run against Supabase or a shared database.
-- Requires a PostgreSQL 17 administrator with CREATE ROLE privilege.
\set ON_ERROR_STOP on
SELECT CASE WHEN current_database() LIKE 'jce_repro_%' THEN 'true' ELSE 'false' END AS jce_is_scratch \gset
\if :jce_is_scratch
\else
\echo 'REFUSING: database must start with jce_repro_'
SELECT 1 / 0; -- ON_ERROR_STOP forces failure
\endif

DO $roles$
DECLARE r text;
BEGIN
 FOREACH r IN ARRAY ARRAY['anon','authenticated','service_role','jce_executor'] LOOP
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname=r) THEN
   EXECUTE format('CREATE ROLE %I NOLOGIN NOSUPERUSER NOBYPASSRLS',r);
  END IF;
 END LOOP;
END
$roles$;

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE SCHEMA IF NOT EXISTS auth;
CREATE TABLE IF NOT EXISTS auth.users (id uuid PRIMARY KEY);
CREATE OR REPLACE FUNCTION auth.uid()
RETURNS uuid LANGUAGE sql STABLE SET search_path = ''
AS $auth$
 SELECT NULLIF(current_setting('request.jwt.claim.sub', true),'')::uuid
$auth$;
REVOKE ALL ON SCHEMA auth FROM PUBLIC;
REVOKE ALL ON auth.users FROM PUBLIC;
REVOKE ALL ON FUNCTION auth.uid() FROM PUBLIC;
-- No real authentication is provided by this local mock.
