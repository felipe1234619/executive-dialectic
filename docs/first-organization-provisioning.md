# First organization — controlled provisioning specification

Status: SPECIFIED, NOT EXECUTED. No users or organizations created.

## Preconditions
1. Identify and approve the founding legal organization, designated institutional administrator and independent approver; document authority out of band.
2. Inspect Supabase Auth site URL, redirect allowlist, enabled providers, MFA, email/SMTP and sign-up policy in dashboard. Disable uncontrolled sign-up before any pilot; do not assume current settings.
3. Create a verified Supabase Auth identity through an approved administrative process, with email confirmation and MFA as policy requires. Do not accept a user UUID supplied by a browser.
4. Reconcile that exact identity against `auth.users` in a protected administrative transaction.
5. Create organization and ADMIN membership using an audited, separately reviewed privileged provisioning path. Existing JCE tables are deny-all for browser roles; do not temporarily grant browser INSERT.
6. Record provisioning request ID, approver, operator, time, organization ID, verified Auth subject, evidence of authorization, and resulting audit linkage. Never include credentials in logs.
7. Independently verify membership and deny all access to a second organization; revoke membership and verify immediate denial.
8. Provide rollback/compensating administrative process without rewriting historical constitutional events.

## Separation of duties
- Platform operator: deploys reviewed provisioning procedure.
- Founding institutional authority: approves organization and first administrator.
- Security reviewer: validates evidence and resulting least-privilege grants.
- Institutional administrator: can invite future members only through a separately audited flow.

## Mandatory negative cases
- No organization created from unauthenticated request.
- Authenticated user without active membership cannot access records.
- User with membership in organization A cannot act on organization B.
- User-editable metadata cannot grant a role.
- Duplicate bootstrap request does not create duplicate organization or membership.
- Revoked membership loses access without waiting for JWT refresh.
- Failure halfway through provisioning leaves no partial constitutional state.

## Release gate
Do not run provisioning against the shared Supabase project until the reviewed SQL/adapter, isolated integration tests, and explicit bootstrap approval are complete.
