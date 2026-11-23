# Founder bootstrap ceremony

Prepared: 2026-11-23. Status: REVIEWED IN CODE / NOT EXECUTED.

The production bootstrap is intentionally blocked until Supabase reports at least one verified MFA factor for founder UUID `471d6599-16ac-40dd-bca5-06bcd52fec28`.

When executed, the script `scripts/bootstrap-founder-after-mfa.sql` will atomically:
1. re-verify the exact confirmed Auth UUID/email;
2. require verified MFA;
3. create deterministic logical organization `Executive Dialectic`;
4. establish the founder as active `ADMIN`;
5. create a founding constitutional decision;
6. append an audit event `FOUNDING_AUTHORITY_ESTABLISHED`;
7. roll back the entire transaction on any conflict/failure.

The ceremony does not claim an incorporated legal entity. It records a logical institutional organization under a natural-person founder.

No bootstrap should occur merely because a dashboard account exists or because an email address appears verified.
