# Constitutional Integration & Enterprise Validation
Status: Phase 1 — baseline only; production release prohibited pending approval.
## Observed database baseline (2026-11-26)
Read-only catalog inspection: jce_private contains eight RLS-enabled tables: audit_events, decision_objects, decisions, evidence, memberships, object_versions, organizations, relations. anon and authenticated have no schema usage or direct table privileges in this schema. Three inspected private functions deny direct execution to both roles. One organization, one membership and one decision exist; their identity and authority were not verified. RLS presence does not establish policy correctness. Membership reader shows no table-level SELECT; inspect column-level grants before drawing conclusions.
## Integration contract (proposed, not deployed)
Server derives actor and organization from verified session and membership, never client input. Map stable case reference CHILE-001 to server-generated decision ID; every mutation carries expected revision and idempotency key. Preserve original versions, evidence provenance, individual positions, dissent, conditions and relations. Separate recommendation, formal resolution and execution authorization. No direct browser writes to private schema. No demo records in production. All views derive from the same authorized revision. Reject stale writes and cross-tenant access.
## Release gates
- G1: inspect actual schema, grants, policies, functions, triggers, auth and founding authority; verify MFA and membership identity.
- G2: map domain objects to existing JCE contract without weakening invariants; approve migration plan and isolated test environment.
- G3: implement shared server-backed read model and authorized commands; retain independent submissions until authorized reveal.
- G4: browser and database tests: anonymous denial, tenant isolation, role escalation denial, duplicate command, stale revision, concurrent writes, immutable history, no majority, dissent retention, rejected proposal closure, condition breach, no automatic execution.
- G5: CHILE-001 end-to-end: original incomplete 45k estimate, 60k ceiling, withdrawal, 72k unverified quote, 52k verified forecast, legal clearance and subsequent liability; preserve each prior state and require human reconsideration.
- G6: responsive UX, accessibility, failure recovery, export provenance, backup/restore and operational review.
- G7: explicit release approval; no production deployment before gates pass.
## Current gaps
Board portfolio and decision lab are separate snapshots. Deliberation, resolution and observatory share only local memory. No verified server integration, private voting, formal authority, browser test or persistent audit chain for these new modules. No schema changes made in phase 1.
