# Identity and authorization — implementation checkpoint

Date: 2026-11-23. Branch: `feature/identity-authorization-v01`.

## Implemented
- First-organization provisioning specification; **no provisioning executed**.
- Pure, deny-by-default authorization policy for read, proposal append, human verification and final authorization (the last is policy-only, not a database operation).
- Server adapter core that accepts only a verified identity from an injected trusted authenticator; membership is loaded via injected backend lookup. Failure is denied. The code has **no network implementation, database connection, or JCE write operation**.
- Twelve isolated negative/positive unit tests for identity forgery, cross-organization access, inactive membership, roles, metadata spoofing, token failure and backend failure.
- GitHub Actions CI unit security gate.

## Verified
GitHub Actions run: https://github.com/felipe1234619/executive-dialectic/actions/runs/45203667618
Result: SUCCESS. These are **mock-based unit tests**, not real Supabase Auth / JCE integration tests.

## Explicit gaps
1. Real Supabase Auth verifier implementation (getUser or equivalent trusted verification), session revocation semantics, and browser authentication UI.
2. Protected membership reader with current database-state checks; avoid service-role/actor identity confusion.
3. Reviewed executor path preserving verified auth.uid() and RLS for append operations.
4. First organization bootstrap, which must not be performed until institutional administrator and approver are identified and security migration is reviewed.
5. Two real verified Auth users and two isolated test organizations, with cross-tenant denial, concurrency, stale revision, rollback and audit-chain integration tests.
6. Edge Function deployment, domain/DNS, GitHub Pages release, native Safari QA.

## Release decision
No external access; no deployment; no Supabase database changes. Never represent mocked identity tests as proof of production authentication.
