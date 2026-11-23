# Institutional launch and security roadmap

Status: approved strategic direction; not a deployment authorization.
Last updated: 2026-11-23.

## Decision adopted — institutional preview

At the appropriate release stage, adapt the clear landing-page model observed in CiteRank **without copying its visual design or claiming operational features**.

- Preserve the approved ivory, graphite, restrained-gold editorial identity.
- Lead with: **Decisions Should Outlive Their Decision-Makers.**
- Show an explicitly labeled **illustrative constitutional decision record**, presenting authority, evidence, dissent and continuity. No fabricated real customers, metrics, live data or functional UI.
- Use **Request Institutional Access** as the prospective call to action.
- During a pre-launch period, that call to action must only collect expressions of interest, not grant access or suggest that the workspace is ready.
- Before collecting data: define lawful basis, clear privacy notice, data minimization, retention, access control, anti-spam, confirmation messaging, and a secured server endpoint. Do not add an unprotected public database insert.
- Keep public institutional preview separate from the restricted application and from any invitation-based pilot.

## Delivery sequence and gates

### Gate A — Application foundation and institutional identity
**Implemented and visually approved as direction.**
- Static site and disabled workspace in feature branch.
- Chromium/WebKit automated layout suite passed on desktop/tablet/mobile.
- Native Safari sign-off and production release review remain outstanding.

### Gate B — Authentication and organizational authorization (NEXT)
**Not implemented.**
1. Inventory existing Supabase Auth configuration and JCE function grants, read-only.
2. Write a threat model: impersonation, forged actor IDs, cross-tenant access, session expiry, replay, concurrent updates, and privilege escalation.
3. Define identity and authority model: verified auth user, organization membership, membership role, decision-scoped authorization, revocation and audit.
4. Specify a narrow server-side API and request/response contracts; never expose private JCE tables or privileged credentials to GitHub Pages.
5. Define acceptance tests for negative cases before implementing code.
6. Build on a separate reviewed branch and test with isolated non-production fixtures. No external user access yet.

### Gate C — Protected JCE integration
**Not implemented.**
- Server validates token with trusted Supabase Auth verification and independently derives actor identity.
- Authorizes tenant, organization and decision scope before calling approved private JCE operations.
- Maintains atomic append, idempotency, stale revision rejection and audit integrity.
- Runs cross-organization and concurrency regression tests.

### Gate D — Decision workflow and dialectical analysis
**Not implemented.**
- Evidence and assumptions; alternatives and dissent; explicit human authorization; conditions for reconsideration.
- Separate AI-generated content from human decisions.

### Gate E — Controlled institutional preview
**Approved as strategy; not implemented.**
- Review preview copy and illustrated record.
- Add consent-aware **Request Institutional Access** interest form backed by a protected endpoint.
- No login invitation or operational claim until Gates B–D pass acceptance tests.
- Review legal notices, accessibility, analytics and security.

### Gate F — Controlled release
**Not authorized.**
- Native Safari and cross-device visual sign-off.
- Security acceptance, GitHub Pages configuration, DNS/HTTPS validation.
- Human approval of merge and publication.
- Separate approval for inviting external organizations to the authenticated application.

## Non-negotiable boundaries

- Supabase project: existing `the-executive-institute`; private JCE schema: `jce_private`. No third Supabase project without authorization.
- No service-role credentials or private database connection strings in client files.
- GitHub Pages is public hosting, not a secure execution environment.
- The Executive Library and Casas da Vila must remain unchanged.
- The institutional preview is not proof of market adoption or technical completeness.

## Next decision to be prepared

Approve a **read-only security preflight and architecture specification** for Supabase Auth + organizational authorization + protected backend, before any new database grants or production authentication changes.
