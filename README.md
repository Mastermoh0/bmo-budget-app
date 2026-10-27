# Bimo authentication and private-budget foundation

This isolated development copy implements the approved database/Better Auth milestone. The original Next.js-upgraded app is preserved at `C:\Users\MasterMoh\bmo-budget-app`, checkpoint `7319b0f`. The current branch is `codex/database-auth-foundation`.

The preview supports verified email/password registration, recovery, email/password changes, session management, private-budget setup and current owner/editor/viewer access. Financial entry, reports, sharing invitations, Gmail, chat and redesign are later milestones. Unported API paths return an explicit unavailable response; the previous source is preserved in `legacy-reference/`, outside the active build. The old Prisma schema/migrations and socket-server source remain reference material.

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

Tests require the local services. `npm test` applies the modern migrations to `bimo_modern_test`, checks a second deployment is a no-op, launches two temporary production instances on ports 3110/3111, tests the complete auth/permission/retry/revocation flows and stops those processes afterward. Only synthetic test records are added; the old database is never a test target.

`npm run build` generates the client and build assets without changing database tables. `npm run db:deploy` validates the declared target and applies reviewed migrations. `npm run db:migrate -- --name bimo_description` creates the next development migration after validation. All Prisma commands use `prisma.config.ts` and `prisma/modern/`; never run reset or `db push` against the old schema. Database target guards reject `budget_app` and mismatched targets.

`npm run mail:retry` processes up to ten due welcome messages (at most three send attempts per event) and prunes expired auth session/rate-limit rows. A sender interrupted after claiming a message leaves `SENDING` for review rather than automatically risking a duplicate; external SMTP cannot promise exactly-once delivery across a process crash.

## Credentials and hosted checks deferred by the user

Google sign-in/linking is wired for identity scopes only and disabled until both `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are placed in the ignored `.env`. Register `http://localhost:3100/api/auth/callback/google` in that OAuth client. There is no Gmail permission or mailbox integration here. Do not put secrets in Git or chat.

Neon is the selected future host for PostgreSQL. Its isolated development target needs a pooled runtime `DATABASE_URL`, direct `DATABASE_URL_UNPOOLED` and matching explicit `BIMO_DATABASE_TARGET`. The current auth base URL is deliberately restricted to loopback until public deployment/sender settings are reviewed. The user postponed real Google, Neon and real email checks on 27 October; no paid plan, public signup deployment or cloud resource was created.

Better Auth 1.7.14 and Prisma CLI/Client/PG adapter 7.10.1 are pinned. `auth` plus `jiti` are development-only schema tooling. Auth models were produced by `npx --no-install auth generate --config ./lib/auth.ts --output ./prisma/modern/generated-auth.prisma --yes`; `schema.prisma` adds the reviewed domain relations and client output path. Keep the generated auth contract aligned when changing auth options/plugins.

The original repository's `bmo-modernization-plan.md` is the shared master plan. This checkout carries a synchronized reference copy for review; update the original when recording progress.
