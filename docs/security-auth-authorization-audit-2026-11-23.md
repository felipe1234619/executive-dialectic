# Security preflight and application authorization audit

Date: 2026-11-23
Scope: read-only Supabase inspection + architecture review. No schema changes, no auth settings changes, no deployment.
Supabase project: `the-executive-institute` (`ezwxcvpcrnsqajixwkvq`).
GitHub branch: `feature/application-foundation-v01`.

## Executive decision

**CONDITIONAL / NOT READY FOR EXTERNAL USERS.** The JCE private kernel has credible database-level isolation; authenticated application integration and organizational authorization have not been implemented or end-to-end tested. The institutional preview may be developed independently, but do not grant JCE access or publish operational claims.

## Direct observations

1. Project is ACTIVE_HEALTHY, PostgreSQL 17.6.1.
2. Eight `jce_private` tables have RLS enabled and FORCE RLS; `anon` and `authenticated` lack SELECT on each.
3. `jce_private` schema USAGE denied to `anon`, `authenticated`, `service_role`.
4. `jce_private.append_object_version` is SECURITY DEFINER owned by `jce_executor`; `anon`, `authenticated`, `service_role` have no direct EXECUTE.
5. `jce_executor`: NOLOGIN, NOSUPERUSER, NOBYPASSRLS.
6. Append function has fixed empty search_path; actor derived from `auth.uid()`; checks active organization membership and selected role; checks scoped reviewer metadata for `HUMAN_VERIFIED_WITH_SCOPE`; serializes decision writers via row lock; checks idempotency; rejects stale revisions; writes object version, audit digest and decision revision in one transaction.
7. Four historical tables (`audit_events`, `evidence`, `object_versions`, `relations`) have immutable UPDATE/DELETE triggers.
8. `auth.users`: 0; `auth.sessions`: 0; JCE organizations: 0; memberships: 0; audit events: 0.
9. Edge Functions deployed in this Supabase project: 0.
10. Security advisor: six INFO no-policy warnings; three JCE deny-all tables (`organizations`, `evidence`, `relations`), plus three pre-existing public tables (`founding_readers`, `institute_events`, `institutional_inquiries`). Do not add broad policies just to silence lints.
11. Performance advisor: nine unindexed foreign keys (INFO), eight `auth_rls_initplan` warnings (WARN), six unused indexes on pre-existing `institute_events` (INFO). Evaluate performance with real workloads before migrations.
12. Supabase Auth provider configuration, redirect allowlist, SMTP settings, MFA and Data API exposed schemas **not verified** through available read-only management interfaces. PostgreSQL setting inspection did not expose PostgREST schema settings; absence of a result is not proof of configuration.

## Critical architectural gap

The executor is a NOLOGIN database role, not an automatically available Supabase Auth role. Existing RLS policies are scoped TO `jce_executor`. A standard authenticated browser session does not become `jce_executor`, and the existing function is intentionally not callable by browser roles. An adapter must establish a reviewed, trusted execution context that preserves `auth.uid()` identity and RLS; using a service-role database connection without explicit identity propagation can fail closed or undermine intended checks. **Do not solve this by granting direct browser EXECUTE, exposing `jce_private`, or trusting a client-supplied actor UUID.**

The append function permits membership roles EDITOR, REVIEWER, AUTHORIZER and ADMIN to append version content. This does not constitute a separate final-decision authorization workflow; formal authorization must be separately modeled and enforced. Reviewer verification has stricter role checks.

## Threat model / required denial tests

| Threat | Required control | Test |
|---|---|---|
| Forged user identity | Verify access token server-side; derive actor from trusted auth context | Client-supplied actor ID ignored/rejected |
| Cross-organization access (BOLA/IDOR) | Organization membership checked on every request and in DB | Org A cannot read/write Org B |
| Privilege escalation | Explicit role and decision-scoped authorization | EDITOR cannot issue final authorization |
| Revoked membership | Check current DB membership on sensitive actions, not stale JWT claims | Revoked member denied immediately |
| Token expiry/session revocation | Trusted token verification and session lifecycle rules | Expired/revoked session denied |
| Replay/idempotency | Per-decision idempotency key and payload binding | Same key/different payload rejected |
| Concurrent edits | Decision revision lock and optimistic concurrency | Exactly one winner, stale writer rejected |
| Audit integrity | Atomic version + audit event and digest chain | Broken chain rejects all writes |
| Privileged endpoint misuse | Least privilege, rate limits, schema validation, bounded payloads | No anonymous write; no unrestricted RPC |
| Cross-site requests | Strict CORS origin allowlist plus bearer-token validation | Disallowed origin and missing token denied |
| Data exfiltration | Bounded queries and explicit field projection | No raw private schema or tenant-wide dumps |

## Proposed adapter architecture (not yet implemented)

`GitHub Pages static frontend` -> `Supabase Auth user session` -> `protected server-side function` -> `trusted identity/organization authorization` -> `reviewed private DB execution path` -> `JCE append and audit`.

Preferred candidate: Supabase Edge Functions in the existing project, subject to explicit design review of the privileged DB execution path, JWT verification and RLS identity propagation. The existing JCE function must not be exposed as a browser RPC. No privileged secrets may appear in the static bundle.

## Next implementation gates

A. Inspect Auth dashboard settings (site URL, redirect allowlist, providers, MFA, email/SMTP, sign-up policy) without changing them. Confirm API exposed schemas in project settings.
B. Design membership provisioning and bootstrap for the first organization. Existing database contains no organizations or users; bootstrap must be authorized and auditable.
C. Design server-side actor binding and executor permissions; prove `auth.uid()` resolves to verified user under executor RLS without trusting request body or user_metadata.
D. Specify minimal APIs: `GET /me`, `GET /organizations`, `GET /decisions/:id`, `POST /decisions/:id/objects/:id/versions` (only after authorized provisioning). Version writes require idempotency key and expected revision. A separate final authorization endpoint must be defined before activation.
E. Implement on a new branch, test with isolated fixtures, run all denial, concurrency, audit and rollback tests.
F. Only after explicit acceptance: enable limited private pilot. Public marketing site and institutional-interest capture are independent release decisions.

## Limitations and boundaries

- This was a structural and configuration preflight, not a penetration test or live user-session end-to-end test.
- No production auth configuration was changed, no test users created, no migration applied, no Edge Function deployed.
- Existing public tables belong to The Executive Library; do not modify their policies based solely on this audit.
- No third Supabase project was created.
- Keep Pages unpublished pending separate approval.

## References

- Supabase changelog: https://supabase.com/changelog.md
- Supabase RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase Edge Functions auth: https://supabase.com/docs/guides/functions/auth
- Security lint: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy
- Foreign key index lint: https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys
- Auth RLS initplan lint: https://supabase.com/docs/guides/database/database-linter?lint=0003_auth_rls_initplan
