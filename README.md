# Bimo local budgeting preview

This isolated development copy implements the approved database/Better Auth milestone. The original Next.js-upgraded app is preserved at `C:\Users\MasterMoh\bmo-budget-app`, checkpoint `7319b0f`. The current branch is `codex/database-auth-foundation`.

The preview supports verified email/password registration, recovery, email/password changes, session management, private-budget setup, current owner/editor/viewer access, financial accounts, category groups/allocations, savings targets, transactions with payees/search/filters, filtered table/chart reports, CSV and portable financial exports, shared notes and household invitations/roles/ownership transfer. Gmail, chat and redesign remain later milestones. Unported API paths return an explicit unavailable response; the previous source is preserved in `legacy-reference/`, outside the active build. The old Prisma schema/migrations and socket-server source remain reference material.

## Run locally

Use Node 24 and Docker Desktop. In this development checkout:

```sh
npm ci --ignore-scripts
npm run local:setup
npm run dev
```

Open [Bimo](http://localhost:3100) and the private [Mailpit test inbox](http://127.0.0.1:8025). Register a synthetic address ending in `example.invalid`, open its captured verification link, then explicitly create a private NGN budget. Local email is captured and never delivered to real inboxes.

Setup generates `.env` with random development secrets only if that file does not already exist. It starts separate loopback-only PostgreSQL (port 5433) and Mailpit containers, creates new dev/test/shadow databases and applies the reviewed modern migrations. It never resets a database or deletes a Docker volume. Re-running setup preserves existing records and settings. Do not use the legacy `docker-compose.yml` or old seeding instructions for this preview.

## Verify

```sh
npm run typecheck
npm run lint
npm run build
npm test
```

Tests require the local services. `npm test` applies the modern migrations to `bimo_modern_test`, checks a second deployment is a no-op, launches two temporary production instances on ports 3110/3111, tests auth, permissions, exact money, retries, rollback and month rules, and stops those processes afterward. Only synthetic test records are added; the old database is never a test target. Stop `npm run dev` before building/testing because both use `.next`; restart it afterward, or use `npm run start` to inspect the verified production build.

## Money rules in this increment

- Open bank/savings/cash accounts with nonnegative opening balances. Record income, categorized expenses/refunds and transfers between two open accounts in the same budget. Fees and payments to other people are separate expenses. Credit, splits, scheduled transactions and currencies besides NGN remain deferred.
- Amounts cross the API as plain decimal strings. PostgreSQL stores exact `Decimal(20,2)` entries; calculations use integer kobo. Balances come from nonvoided entries, never an editable balance field. The database checks transfer conservation and account/category budget boundaries.
- Assign or return category money for a selected month and move available money between categories. Positive availability carries; a negative category resets next month and reduces ready to assign once. Future allocations reserve funds without changing bank balances. Only already received transactions can be posted; future dated transactions are rejected.
- Corrections keep transaction identity and before/after history. Void an incorrect transaction to reverse its money effect without deleting it. Opening balances can be corrected but cannot be voided or moved to another account. Reopen closed accounts before historical edits. Nonzero accounts cannot close; archived categories retain their money/history.
- Every save uses an operation key/fingerprint in the same database transaction. Retry an unconfirmed save with its original details/key. Stale corrections and stale allocations return a conflict. All writers lock the selected budget and check its current permission before acting.
- Transactions are listed 50 per month/page; month CSV includes active and voided records with explicit status and neutralizes spreadsheet formulas. Export is capped at 10,000 records per month and fails visibly above that size. Reports exclude voided records and internal transfers. Activity shows the latest 20 operations; full before/after records are retained in the database.

Browser evidence and the walkthrough recording are stored outside the repository in `C:\Users\MasterMoh\.codex\visualizations\2026\10\25\01a173e9-b493-7902-9acb-c6ccae4374e8\money-engine-2026-10-28`. The current desktop screens are functional verification screens; Canvas/Night Desk visual integration and the separate mobile composition are still planned.

`npm run build` generates the client and build assets without changing database tables. `npm run db:deploy` validates the declared target and applies reviewed migrations. `npm run db:migrate -- --name bimo_description` creates the next development migration after validation. All Prisma commands use `prisma.config.ts` and `prisma/modern/`; never run reset or `db push` against the old schema. Database target guards reject `budget_app` and mismatched targets.

`npm run mail:retry` processes up to ten due welcome messages (at most three send attempts per event) and prunes expired auth session/rate-limit rows. A sender interrupted after claiming a message leaves `SENDING` for review rather than automatically risking a duplicate; external SMTP cannot promise exactly-once delivery across a process crash.

## Category groups and savings targets

Groups on the Budget page support creation, renaming, reordering, category placement/moves and safe archival/reopening. Existing categories remain ungrouped until explicitly moved. Group totals include archived financial records. Active categories must be moved or archived before their group can be archived; no grouping action changes money. Category choices include group labels, and active categories can be reordered within their group.

The Targets page supports one current planning target per category:

- Monthly contribution: track the net amount assigned in each selected month from the start month onward. Carryover, spending and refunds do not count as fresh contributions. Returning/moving allocations out reduces monthly progress. Each month starts a new contribution period.
- Save by date: track current positive category availability against an amount and deadline. Carryover counts, spending reduces progress and refunds restore it. Suggested extra funding divides the remaining amount across months through the deadline, including the selected month, rounding up to a kobo.
- Negative availability or negative monthly net assignment is included in the amount still needed. Displayed progress stays at zero while a negative balance is being covered; the explanation identifies that shortfall.
- Targets never allocate money or create account entries. Edits change the current planning guidance from its start month; previous definitions remain in the operation history rather than separate historical goal snapshots. Removal keeps the target row, audit records and all money. A removed target can be set again with its current version.

Owners/editors can manage groups and targets; viewers read them. Every mutation uses the existing budget lock, current permission check, stale-version check and request-key journal. Migration `20261028082654_bimo_groups_targets` is additive and preserves all financial entries. It enforces budget-scoped group/category links, positive exact target amounts and valid target date/type shapes.

Recorded browser evidence: `C:\Users\MasterMoh\.codex\visualizations\2026\10\25\01a173e9-b493-7902-9acb-c6ccae4374e8\groups-targets-2026-10-28\evidence.md`. The shared master plan records the milestone and links the screenshots/recordings.

## Canvas appearance and loading feedback

The working app uses the approved Canvas composition and light palette, with Night Desk charcoal/amber dark mode. The header switch remembers an explicit browser choice; switching keeps the page, selected month, unfinished fields and financial records. Manrope and its OFL licence are served locally. The Budget page has expandable purpose groups/categories, a detailed worksheet and progressive management/notes controls.

Next.js route loading boundaries show real skeletons for budget pages, Settings, auth/setup and invitations. Loading announces one status, hides decorative placeholders, uses no sample balances and respects reduced motion. No artificial production delay is added. Actions react on press, show a pending label/indicator while waiting and prevent repeated submissions. Month/filter navigation also shows progress.

Unexpected internal/provider errors are replaced with friendly guidance. A failed money save retains its original request and explains that retry sends those original details, even after visible edits. Settings requests requiring fresh authentication lead to a friendly sign-in notice and return to Settings afterward. `DESIGN.md`, `PRODUCT.md` and `.impeccable/design.json` describe the built system; the shared master plan links screenshots, recordings and the independent review.

Evidence: `C:\Users\MasterMoh\.codex\visualizations\2026\10\25\01a173e9-b493-7902-9acb-c6ccae4374e8\canvas-design-2026-10-29\evidence.md`.

## Focused task windows

Focused budgeting forms now open in task windows: assignments, category moves, transactions/corrections, account/category/group management and savings targets. Cancel, Close, Escape or an outside click dismiss an idle window; successful saves refresh and close. Pending saves remain open. Closing/reopening an unconfirmed save on the same mounted page retains its original retry details; reloading or navigating away does not persist that client state. The native modal contains focus and blocks background interaction. See the shared plan's section 37 and the [recorded popup checks](C:/Users/MasterMoh/.codex/visualizations/2026/10/25/01a173e9-b493-7902-9acb-c6ccae4374e8/task-windows-2026-10-29/evidence.md).

## Credentials and hosted checks deferred by the user

Google sign-in/linking is wired for identity scopes only and disabled until both `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are placed in the ignored `.env`. Register `http://localhost:3100/api/auth/callback/google` in that OAuth client. There is no Gmail permission or mailbox integration here. Do not put secrets in Git or chat.

Neon is the selected future host for PostgreSQL. Its isolated development target needs a pooled runtime `DATABASE_URL`, direct `DATABASE_URL_UNPOOLED` and matching explicit `BIMO_DATABASE_TARGET`. The current auth base URL is deliberately restricted to loopback until public deployment/sender settings are reviewed. The user postponed real Google, Neon and real email checks on 27 October; no paid plan, public signup deployment or cloud resource was created.

Better Auth 1.7.14 and Prisma CLI/Client/PG adapter 7.10.1 are pinned. `auth` plus `jiti` are development-only schema tooling. Auth models were produced by `npx --no-install auth generate --config ./lib/auth.ts --output ./prisma/modern/generated-auth.prisma --yes`; `schema.prisma` adds the reviewed domain relations and client output path. Keep the generated auth contract aligned when changing auth options/plugins.

The original repository's `bmo-modernization-plan.md` is the shared master plan. This checkout carries a synchronized reference copy for review; update the original when recording progress.
