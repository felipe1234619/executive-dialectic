# JCE Constitutional Hardening — Phase II
Status: proposed contract; not deployed. Production remains unchanged.
## Authority matrix
READER: authorized read only. EDITOR: evidence and nonbinding proposals. REVIEWER: evidence, proposals and scoped verification. AUTHORIZER: formal judgment and separate execution authorization only within assigned decision competence. ADMIN: membership administration, not business authority. All roles read only within assigned scope. Ballot eligibility requires separate committee assignment. No role may rewrite history. Default deny unknown commands. Existing single-role membership model cannot represent all combinations; do not silently elevate ADMIN. Establish separately authorized test identities.
## Sensitive operations
Require verified session identity, active membership, decision scope, AAL2, and explicit operation permission at transaction boundary. Never trust actor, role, origin or authorization claims supplied by browser. Model proposals cannot constitute formal judgment. Execution requires separate human command, valid resolution, verified current conditions, no unresolved blocking trigger, expected revision and idempotency key. Reject stale writes; lock decision and check current authority in transaction. No public generic append adapter.
## Integrity changes proposed
Strengthen scoped verification CHECK with explicit verification_basis IS NOT NULL; inspect existing rows first. Preserve genesis digest and legacy algorithm; introduce explicit hash version and unambiguous canonical encoding for future events only. Test replay, concurrency, cross-tenant references, revoked memberships, AAL1 denial, ballot confidentiality, dissent preservation, rejected closure, condition breach and no automatic execution.
## Environment
Supabase development branch requested but provider requires cost confirmation; no branch created. Prefer isolated branch with synthetic data, verify migration parity before tests. Alternative local Supabase environment with synthetic fixtures. Never run mutation tests against production. No production credentials or real user data in fixtures.
## Acceptance
Test each role and command with positive and negative cases; record SQLSTATE and unchanged revision on denial. Verify original audit digest remains unchanged. No release until runtime tests pass and explicit approval.
