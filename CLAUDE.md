# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Run Commands

```bash
npm run dev        # Development server (http://localhost:3000)
npm run build      # Production build
npm start          # Start production server
npm run lint       # ESLint

# Docker
docker-compose --profile dev up -d    # Dev with hot reload
docker-compose --profile prod up -d   # Production standalone
```

## Architecture Overview

Multi-tenant authentication system with dual auth: NextAuth sessions for the web UI, and custom JWT tokens for the REST API.

### Dual Authentication System

- **Web UI (NextAuth v5)**: Credentials provider in `auth.config.ts` → bcrypt password verification → session token. Protected routes validated in `middleware.ts` via `getToken()`.
- **REST API (Custom JWT)**: `POST /api/v1/auth/login` → access token (1h) + refresh token (7d, stored in DB). API routes validate via `apiMiddleware()` in `app/lib/api-middleware.ts`.

### Role Hierarchy

- **Super Admin** (`is_super_admin`): No company assignment. Full system access, manages all companies and users.
- **Company Admin** (`isadmin` + `company_id`): Scoped to their company. Manages users/invitations within it.
- **Regular User**: Basic access, can accept invitations, manage own profile.

### Key Modules

| Module | Purpose |
|--------|---------|
| `middleware.ts` | Route protection, CORS preflight, auth redirects, basePath handling |
| `app/lib/db.ts` | PostgreSQL pool (raw SQL with `pg`, no ORM) |
| `app/lib/jwt-service.ts` | Access/refresh token generation and verification |
| `app/lib/api-middleware.ts` | Rate limiting (100/15min/IP), CORS headers, role-based auth guards |
| `app/lib/definitions.ts` | TypeScript types for User, Company, Invitation |
| `app/actions/` | Server actions for form submissions (auth, profile, admin) |
| `app/seed/route.ts` | `GET /seed` drops and recreates all tables with sample data |
| `app/lib/seed.ts` | Reusable reset/create/insert functions backing `GET /seed` |
| `scripts/schema.mjs` | Shared table DDL used by both `docker-auto-seed.mjs` and `docker-ensure-schema.mjs` |
| `scripts/docker-auto-seed.mjs` | Dev container startup: creates schema + sample users if `users` doesn't exist yet |
| `scripts/docker-ensure-schema.mjs` | Prod container startup: creates schema only (no sample data), then runs bootstrap-admin |
| `scripts/bootstrap-admin.mjs` | Creates the first super admin from `BOOTSTRAP_ADMIN_EMAIL`/`BOOTSTRAP_ADMIN_PASSWORD` if none exists |

### API Structure

All REST endpoints live under `/api/v1/`:
- `/auth/` — login, register, logout, refresh, verify, setup
- `/users/` — CRUD, `me`, password management
- `/companies/` — CRUD (super admin only)
- `/invitations/` — invitation management

### Database

PostgreSQL with raw parameterized queries. Tables: `companies`, `users`, `invitations`, `api_refresh_tokens`. Connection configured via `POSTGRES_URL`. SSL controlled by `DATABASE_SSL` env var.

Seed the database by hitting `GET /seed` — this drops all tables and recreates them with sample users (password: `123456`). This is separate from the automatic startup bootstrapping below.

**Automatic schema bootstrap on container startup** (see `docker-compose.yml`'s `command:` for each service):
- **Dev** (`auth-app-dev`): `scripts/docker-auto-seed.mjs` runs before `pnpm dev`. If `users` doesn't exist yet, creates the schema and the same two sample users as `GET /seed`. No-ops on every later start.
- **Prod** (`auth-app-prod`): `scripts/docker-ensure-schema.mjs` runs before `node server.js`. Always creates the schema if missing (idempotent), but never inserts sample data. It then calls `scripts/bootstrap-admin.mjs`, which creates exactly one super admin from `BOOTSTRAP_ADMIN_EMAIL`/`BOOTSTRAP_ADMIN_PASSWORD` if no super admin exists yet (forced `must_change_password`). If neither var is set, it warns and continues; if only one is set, or the password is outside 6–100 chars, it fails the container start rather than silently skipping.

Both scripts are plain Node/`pg`/`bcryptjs` — deliberately kept outside the Next.js app so they never go through webpack/edge-runtime bundling (a Next.js `instrumentation.ts` hook was tried first and rejected: `pg`'s dependency chain needs `fs`/`path`/`net`, which broke the Edge runtime compile and failed `next build` outright).

`next.config.ts` sets `serverExternalPackages: ["pg", "bcryptjs"]` — Next inlines small deps like `bcryptjs` straight into the webpack bundle by default instead of leaving them in `node_modules`, which breaks these scripts (they `require`/`import` them directly via plain Node, outside any bundle). If you add another dependency to `scripts/`, it needs to go in this list too, and the `Dockerfile` runner stage's `COPY --from=builder .../scripts` needs to still find it in `.next/standalone/node_modules`.

### BasePath Support

The app can be mounted at a custom path via `NEXT_PUBLIC_BASE_PATH` (e.g., `/auth`). This affects middleware routing, redirects, and static assets. The `basePath()` utility in `app/lib/utils.ts` provides the current base path.

`basePath` is compiled into the server at **build time** (`next.config.ts` reads the env var during `next build`), not read at container runtime. Setting `NEXT_PUBLIC_BASE_PATH` in `docker-compose.yml`'s `environment:` has no effect by itself — it must also be passed as a `build.args` value (already wired up for `auth-app-dev`/`auth-app-prod` in `docker-compose.yml`), and the image rebuilt, to change it.

## Environment Variables

Required: `POSTGRES_URL`, `AUTH_SECRET`, `JWT_SECRET`, `JWT_REFRESH_SECRET`

Optional: `NEXT_PUBLIC_BASE_PATH`, `ALLOWED_ORIGINS` (comma-separated), `DATABASE_SSL` (true/false/allow), `APP_PORT` (Docker host port), `AUTH_TRUST_HOST`, `BOOTSTRAP_ADMIN_EMAIL` + `BOOTSTRAP_ADMIN_PASSWORD` (prod only — auto-creates the first super admin on startup if none exists yet; see `scripts/bootstrap-admin.mjs`)

## Docker

Multi-stage Dockerfile: `base` → `deps` → `dev` / `builder` → `runner`. Dev profile mounts source with polling-based file watching. Production uses Next.js standalone output with non-root user.

External networks (must exist before `docker compose up`, since both are declared `external: true`):
- `my-shared-proxy-net` — dev profile
- `edge` — prod profile (normally provided by the real Caddy reverse-proxy stack; see below for local testing without it)

pnpm 10/11's supply-chain policy blocks native install scripts (`sharp`, `unrs-resolver`) unless explicitly approved — this is set in `pnpm-workspace.yaml`'s `allowBuilds`/`onlyBuiltDependencies`, which the `deps` stage's `COPY` must include (`pnpm-workspace.yaml*`) or `pnpm install --frozen-lockfile` fails with `ERR_PNPM_IGNORED_BUILDS` inside Docker (it only warns, not fails, in an interactive local shell — the difference is TTY vs non-TTY, not the pnpm version by itself).

### Testing the prod profile locally without a reverse proxy

`docker-compose.override.yml` (gitignored, not committed — create it yourself if missing) layers on top of `docker-compose.yml` automatically whenever no `-f` flag is passed:
- Maps `auth-app-prod` to `localhost:${PROD_TEST_PORT:-3000}` directly (bypassing the need for Caddy).
- Adds a disposable `postgres-prod-test` service with no named volume — its data is gone once the container is removed — and points `auth-app-prod`'s `POSTGRES_URL` at it instead of the real prod database.
- Supplies throwaway `JWT_SECRET`/`JWT_REFRESH_SECRET` if `.env` doesn't define them (only the real prod deployment needs to set those for real).

One-time setup: `docker network create edge` (just needs to exist — no actual Caddy required for local testing). Then:
```bash
docker compose --profile prod up -d --build
curl http://localhost:3000/seed   # or set BOOTSTRAP_ADMIN_EMAIL/PASSWORD instead
docker compose --profile prod down -v   # -v also wipes the disposable DB's volume
```
