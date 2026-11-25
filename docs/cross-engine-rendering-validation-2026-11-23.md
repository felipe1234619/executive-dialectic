# Cross-engine rendering validation — 2026-11-23

Branch: `feature/application-foundation-v01`
Commit: `ec4b37ecb56a11762e82745e4389e717df335509`
GitHub Actions: https://github.com/felipe1234619/executive-dialectic/actions/runs/45193563477

## Outcome

**PASS** — Chromium and WebKit browser rendering suite on Ubuntu container (Playwright 1.58.2).

- 18 browser checks: 2 engines × (4 homepage sizes + 4 workspace sizes + 1 keyboard/anchor test).
- Sizes: 1440×900 desktop; 768×1024 tablet; 390×844 mobile; 320×700 compact mobile.
- Confirmed: one main landmark, page heading, skip link, preview disclosure, no horizontal document overflow, no broken images, disabled workspace notice, no password input, keyboard skip link and method anchor navigation.
- Offline static structural quality gate: **PASS**.
- Screenshots and test reports: GitHub Actions artifact `executive-dialectic-browser-qa` (14-day retention).

## Corrections during validation

1. GitHub-hosted Ubuntu 26 runner was not supported by the selected Playwright browser installer; switched to a pinned official Playwright Noble container.
2. Structural verifier incorrectly treated `./` as a missing file; corrected directory index resolution.
3. Browser test preview locator matched both hero and footer; restricted it to the intended hero status element.

These were test infrastructure issues, not verified production UI defects.

## Limits

- WebKit on Linux is a Safari-engine proxy, **not native Safari on macOS/iOS**.
- Automated assertions and generated screenshots are not a manual visual-design sign-off; screenshots have not been individually inspected by a human reviewer.
- No authenticated workflows or JCE integration were tested; those features are not implemented.
- No deployment, DNS changes, merge to main, or Supabase modifications occurred.

## Release gate

The automated rendering gate passed. Native Safari QA, editorial review and explicit approval remain required before public deployment.
