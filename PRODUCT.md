# Bimo

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users and purpose

Confirmed across the project discussion: individuals and households in Nigeria first. Help people plan money they already have, record income/spending/refunds/transfers, see what remains and collaborate on explicitly shared budgets. Returning daily users should complete ordinary money tasks quickly.

## Capabilities and constraints

Next.js, Better Auth and Prisma/PostgreSQL. Local correctness checks already cover exact NGN money, groups, targets, reports, notes, household invitations and owner/editor/viewer permissions. Neon Free and Vercel Hobby are the selected future hosts; real providers remain deferred by the user. Respect the zero-dollar pilot requirement without promising capacity by user count.

This implementation is authorized; the original source/database and prior prototype captures remain preserved. Do not replace live records with the prototypes' synthetic sample amounts. The ledger and permission checks are authoritative in both themes. Gmail is optional, separately consented, and not connected yet; sign-in does not grant mailbox access. Never add a working-looking fake connector or parser. Account deletion, Sentry, hosted recovery and real email delivery still have release gates.

## Guided practice

Implemented 30 October 2026. New learners, including people with view-only access to somebody else's budget, can learn through four saved tasks: add a ₦100,000 Practice wallet account, assign ₦20,000 to Food and ₦10,000 to Transport, record a ₦2,000 Food expense, then move ₦5,000 from Transport to Food. The real money engine produces ₦98,000 account total, ₦70,000 ready to assign, ₦23,000 Food and ₦5,000 Transport. The optional two-step challenge records a further ₦26,000 Food expense and covers its ₦3,000 shortfall from Transport, ending at ₦72,000 account total, ₦70,000 ready, ₦0 Food and ₦2,000 Transport. These are explicitly marked practice tasks and resulting ledger values, never initial values for a real budget.

Learn Bimo is available in main navigation. A short welcome leads to native working forms beside a compact contextual guide, truthful progress/checklist and saved completion. Back and completed-mission review explain prior results without undoing the ledger. Skip preserves the place; resume and replay are deliberate persistent choices. Personal progress is stored per user and is separate from household setup. The private sample budget is explicitly marked, uses the same transactional engine and cannot be exported or shared by invitation; unsupported practice actions and access to another learner's sample are blocked server-side. Finish and restart verify the bound sample budget before discarding its records; personal completion is retained and no sample money is copied into real budgets.

The Appcues article informed the welcome, contextual guidance, optional entry and progressive disclosure. No Appcues SDK, paid service, fake scores/streaks or forced timer is included. The existing narrow fallback keeps learning and controls reachable. Automated functional and visual evidence does not establish human beginner comprehension, completion in five minutes or public-release readiness.

## Brand commitments

User-approved Canvas layout/light colours with Night Desk dark colours, selected on 25 October and explicitly approved for application implementation on 29 October 2026. Top navigation, inset workspace, grouped purposes and consistent geometry in both themes. Reuse the self-hosted Manrope face and provisional authored mark from the accepted prototype. The user specifically requests real skeleton loaders now. A distinct mobile composition remains separate work. Guided practice is implemented as an additive extension of the same approved system.

## Evidence

The shared master plan is C:/Users/MasterMoh/bmo-budget-app/bmo-modernization-plan.md. Approved prototype: C:/Users/MasterMoh/.codex/visualizations/2026/10/25/01a173e9-b493-7902-9acb-c6ccae4374e8/desktop-concepts/canvas-light-dark/. The project discussion already supplies the product interview/approval; this updates the historical prototype PRODUCT.md for the working app without reopening settled decisions.

Guided-practice evidence: C:/Users/MasterMoh/.codex/visualizations/2026/10/25/01a173e9-b493-7902-9acb-c6ccae4374e8/onboarding-2026-10-30/. The final finish-verdict.md is SHIP and supersedes the initial FIX review: the welcome eyebrow was removed and the inconclusive dark/empty-state captures were replaced. The supplied logs/reconciliation support isolation, exact balances, safe retries and sample cleanup. Documentation sync reads these artifacts and source; it does not independently rerun browser or integration checks.

## Principles

- Give available money a purpose; never invent balances.
- Preserve financial work and safe original-request retries during navigation, saves and loading.
- Show what is available, unavailable, loading or failed in plain language.
- Use independent logins and budget-scoped access; viewers cannot write.
- Keep everyday desktop work clear in both themes. Narrow fallbacks keep every feature reachable, without claiming the separate mobile milestone is finished.
