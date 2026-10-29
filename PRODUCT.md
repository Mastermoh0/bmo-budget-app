# Bimo

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users and purpose

Confirmed across the project discussion: individuals and households in Nigeria first. Help people plan money they already have, record income/spending/refunds/transfers, see what remains and collaborate on explicitly shared budgets. Returning daily users should complete ordinary money tasks quickly.

## Capabilities and constraints

Next.js, Better Auth and Prisma/PostgreSQL. Local correctness checks already cover exact NGN money, groups, targets, reports, notes, household invitations and owner/editor/viewer permissions. Neon Free and Vercel Hobby are the selected future hosts; real providers remain deferred by the user. Respect the zero-dollar pilot requirement without promising capacity by user count.

This implementation is authorized; the original source/database and prior prototype captures remain preserved. Do not replace live records with the prototypes' synthetic sample amounts. The ledger and permission checks are authoritative in both themes. Gmail is optional, separately consented, and not connected yet; sign-in does not grant mailbox access. Never add a working-looking fake connector or parser. Account deletion, Sentry, hosted recovery and real email delivery still have release gates.

## Brand commitments

User-approved Canvas layout/light colours with Night Desk dark colours, selected on 25 October and explicitly approved for application implementation on 29 October 2026. Top navigation, inset workspace, grouped purposes and consistent geometry in both themes. Reuse the self-hosted Manrope face and provisional authored mark from the accepted prototype. The user specifically requests real skeleton loaders now. A distinct mobile composition and the game-like tutorial remain separate work.

## Evidence

The shared master plan is C:/Users/MasterMoh/bmo-budget-app/bmo-modernization-plan.md. Approved prototype: C:/Users/MasterMoh/.codex/visualizations/2026/10/25/01a173e9-b493-7902-9acb-c6ccae4374e8/desktop-concepts/canvas-light-dark/. The project discussion already supplies the product interview/approval; this updates the historical prototype PRODUCT.md for the working app without reopening settled decisions.

## Principles

- Give available money a purpose; never invent balances.
- Preserve financial work and safe original-request retries during navigation, saves and loading.
- Show what is available, unavailable, loading or failed in plain language.
- Use independent logins and budget-scoped access; viewers cannot write.
- Keep everyday desktop work clear in both themes. Narrow fallbacks keep every feature reachable, without claiming the separate mobile milestone is finished.
