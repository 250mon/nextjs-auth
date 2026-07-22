This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Features

### Multi-Tenancy System
- **Company Management**: Multi-tenant architecture with company isolation
- **Super Admin**: Special admin role with full system access
- **Company Admins**: Regular admins scoped to their company
- **User Management**: Company-scoped user management with invitation system

### User Enrollment
- **Invitation-Based Enrollment**: Secure invitation system for company admins
- **Public Invitation Acceptance**: Users can accept invitations via unique tokens
- **Automatic Company Assignment**: Users are automatically assigned to companies upon invitation acceptance

### Admin Features
- **User Management**: Create, update, delete, and manage users
- **Company Management**: Full CRUD operations for companies (super admin only)
- **Invitation Management**: Send, revoke, and track user invitations
- **Company Isolation**: Regular admins can only manage users within their company
- **Search Functionality**: Real-time search with debouncing on all admin pages
  - Users: Search by name or email
  - Companies: Search by name or description
  - Invitations: Search by email or company name

## Project Structure

### Actions Organization
Admin-related actions are organized in `/app/actions/admin/`:
- `user-actions.ts` - User management (create, update, delete, toggle status)
- `company-actions.ts` - Company management (CRUD operations)
- `invitation-actions.ts` - Invitation management (create, accept, revoke)

### Key Directories
- `/app/dashboard/admin/` - Admin dashboard pages
  - `/users` - User management with search functionality
  - `/companies` - Company management (super admin only) with search
  - `/invitations` - Invitation management with search
- `/app/ui/admin/` - Admin UI components
- `/app/ui/search.tsx` - Reusable search component with URL-based filtering
- `/app/invite/[token]` - Public invitation acceptance page

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Docker Deployment

This project includes Docker configuration for easy deployment.

### Prerequisites

- Docker and Docker Compose installed on your system
- For dev (`docker-compose.dev.yml`), the external `my-shared-proxy-net` Docker network must already exist (`docker network create my-shared-proxy-net`) — this is only for cross-container dev traffic (e.g. `inventory-app-dev` calling this app), not the database
- For prod (`docker-compose.yml`), the external `edge` Docker network must already exist — this is the shared network created by the `danaul-caddy` reverse proxy stack, which routes traffic to this app directly (there is no nginx or published host port in prod anymore). To try prod without a real reverse proxy, see [Testing prod locally without a reverse proxy](#testing-prod-locally-without-a-reverse-proxy)

### Quick Start

1. **Set up environment variables**:

   Dev and prod load from **separate** example files, since several variables genuinely differ between them (base path, CORS origins, database):

   ```bash
   # dev
   cp dev.env.example .env

   # prod
   cp .env.example .env
   ```

   Each host only ever runs one of the two against its own `.env`, so there's no conflict — see [Environment Variables](#environment-variables) below for what's in each.

2. **Build and start the application**:
   ```bash
   # For development (hot reload, published on APP_PORT, joins my-shared-proxy-net,
   # and spins up its own local `postgres` container) — docker-compose.dev.yml
   docker compose -f docker-compose.dev.yml up -d

   # For production (standalone build, joins the danaul-caddy edge network,
   # connects to the shared prod Postgres instance via POSTGRES_URL) — docker-compose.yml
   docker compose up -d
   ```

3. **Database is initialized automatically** — no manual step needed:
   - **Dev**: on a fresh Postgres volume, `scripts/docker-auto-seed.mjs` creates the schema and two sample users (see [Database Seeding](#database-seeding)) before the dev server starts. No-ops on every later start.
   - **Prod**: `scripts/docker-ensure-schema.mjs` always creates the schema if missing (never inserts sample data), then creates exactly one super admin from `BOOTSTRAP_ADMIN_EMAIL`/`BOOTSTRAP_ADMIN_PASSWORD` if none exists yet (forced to change password on first login) — see [Production Deployment](#production-deployment).

4. **Access the application**:
   - Development: http://localhost:${APP_PORT:-13203}
   - Production: not published to the host — reachable only via the shared `edge` network at the container alias `auth-app-prod:3000` (under the `/auth` base path by default), which `danaul-caddy` reverse-proxies to (see [Networking](#networking))

### Docker Commands

- **Start development environment**: `docker compose -f docker-compose.dev.yml up -d`
- **Start production environment**: `docker compose up -d`
- **Stop application**: `docker compose -f docker-compose.dev.yml down` or `docker compose down`
- **View logs**: `docker compose -f docker-compose.dev.yml logs -f` or `docker compose logs -f`
- **Rebuild after changes**: `docker compose -f docker-compose.dev.yml up -d --build` or `docker compose up -d --build`

### Environment Variables

Dev and prod load from separate example files (`dev.env.example` / `.env.example`, see Quick Start above) — copy whichever matches the environment you're running to `.env`. A few variables also have environment-specific fallback defaults set directly in the corresponding compose file (`docker-compose.dev.yml` for dev, `docker-compose.yml` for prod), used when the variable isn't set in `.env`.

- `POSTGRES_URL` - **Required for `prod`** - Full PostgreSQL connection string for the shared prod instance (e.g., `postgresql://user:password@host:port/database`). Not read for `dev` — see below
- `JWT_SECRET` - Secret for signing API access tokens (⚠️ CHANGE IN PRODUCTION!)
- `JWT_REFRESH_SECRET` - Secret for signing API refresh tokens (⚠️ CHANGE IN PRODUCTION!)
- `AUTH_SECRET` - NextAuth secret used to sign the session JWT (⚠️ CHANGE IN PRODUCTION!)
- `AUTH_TRUST_HOST` - Needed by NextAuth when the app sits behind a reverse proxy (e.g. danaul-caddy) so it trusts the forwarded host/protocol
- `ALLOWED_ORIGINS` - CORS allowed origins, comma-separated — genuinely different between dev and prod (e.g. `http://localhost:13203` for dev, your real domain(s) for prod; see [CORS_CONFIGURATION.md](./CORS_CONFIGURATION.md))
- `NEXT_PUBLIC_BASE_PATH` - Mounts the whole app (pages and API routes) under a subpath, e.g. `/auth`, for reverse-proxy deployments. Read at both build time and runtime. Defaults to `/auth` for prod; unset (root path) for dev
- `APP_PORT` - Host port published in dev only (default: `13203`). Prod no longer publishes a host port — see Networking below
- `NODE_ENV` - Node environment (defaults to `development` for `dev`, `production` for `prod`)
- `DATABASE_SSL` - Whether to require SSL for the Postgres connection. Hardcoded to `false` for `dev` (local Postgres, no SSL); configurable for `prod` (default: `false`)
- `DEBUG` - Debug logging, e.g. `postgres:*` to log DB queries (defaults to `postgres:*` for `dev`, `false` for `prod`)
- `WATCHPACK_POLLING` / `CHOKIDAR_USEPOLLING` - Enable polling-based file watching so hot reload works inside the `dev` container (both default to `true`)
- `BOOTSTRAP_ADMIN_EMAIL` / `BOOTSTRAP_ADMIN_PASSWORD` - **`prod` only** - If no super admin exists yet, both must be set to auto-create the first one on startup (forced to change password on first login). Leave unset once you've created your first admin — see [Production Deployment](#production-deployment)

#### Local dev database

Dev no longer shares the prod Postgres instance. `docker-compose.dev.yml` defines a `postgres` service that `auth-app-dev` depends on and connects to at `postgres:5432`; `POSTGRES_URL` and `DATABASE_SSL` are constructed directly in `docker-compose.dev.yml` rather than read from `.env`. Optional overrides, with defaults matching the `postgres` service itself:

- `DEV_POSTGRES_USER` (default: `postgres`)
- `DEV_POSTGRES_PASSWORD` (default: `postgres`)
- `DEV_POSTGRES_DB` (default: `danaul_auth`)

**Note**: Next.js also reads `.env` automatically outside of Docker (e.g. `pnpm dev`), so the same file can be reused for non-Docker local development.

### Networking

- **Service names**: The Compose services are `auth-app-dev` (image `lambki/auth-app-dev`, defined in `docker-compose.dev.yml`) and `auth-app-prod` (image `lambki/auth-app-prod`, defined in `docker-compose.yml`), each running in a like-named container. These were renamed from the earlier `app-dev` / `app-prod` names.
- **Development** (`docker-compose.dev.yml`): Publishes the app on the host at `${APP_PORT:-13203}` and joins both the external `my-shared-proxy-net` network (for cross-app dev traffic, e.g. `inventory-app-dev` calling this app) and the project's own default network (to reach the `postgres` service by name).
- **Production** (`docker-compose.yml`): Does **not** publish a host port or join `my-shared-proxy-net`. It only `expose`s port 3000 internally and joins the external `edge` network (the shared network created by the `danaul-caddy` stack) under the stable alias `auth-app-prod`. `danaul-caddy` reverse-proxies directly to `auth-app-prod:3000` over that network — nginx is no longer part of the request path. It connects to the shared prod Postgres instance via `POSTGRES_URL`, not over `edge`.
- Both `my-shared-proxy-net` and `edge` are declared as `external: true` and must already exist before starting the corresponding compose file.
- Other apps that call this service (e.g. the sibling `nextjs-inventory` app via its `AUTH_API_BASE_URL`) reach it the same way — over the shared `edge` network at `auth-app-prod:3000` in production.

### Production Deployment

For production, make sure to:

1. Set strong, unique secrets for `JWT_SECRET`, `JWT_REFRESH_SECRET`, and `AUTH_SECRET`
2. Configure `ALLOWED_ORIGINS` with specific domains (not `*`)
3. Keep `.env` out of version control and secured on the host, or use Docker secrets
4. Ensure your external PostgreSQL database has SSL/TLS enabled
5. Set up proper backup strategies for your external PostgreSQL database
6. Use a secure connection string format: `postgresql://user:password@host:port/database?sslmode=require`
7. Make sure the external `edge` Docker network (created by the `danaul-caddy` stack) exists before running `docker compose up -d`, and that `danaul-caddy` is configured to route to the `auth-app-prod` alias on port 3000
8. Set `BOOTSTRAP_ADMIN_EMAIL` and `BOOTSTRAP_ADMIN_PASSWORD` before the first ever startup against a fresh database, so you have real admin credentials from day one instead of relying on `GET /seed`'s sample account (see [Database Seeding](#database-seeding) — that route is not safe to use in prod). Both env vars can be removed again afterward; `scripts/bootstrap-admin.mjs` only acts when no super admin exists yet

### Testing prod locally without a reverse proxy

You don't need a real `danaul-caddy`/Caddy instance to try prod locally. Create a `docker-compose.override.yml` (gitignored — Compose merges it in automatically on top of `docker-compose.yml` whenever no `-f` flag is passed) that maps `auth-app-prod` to a host port directly; by default it still uses whatever `POSTGRES_URL` is in `.env`. If you don't already have a Postgres to point it at, opt in to a disposable one with `docker-compose.testdb.yml` (also gitignored, added explicitly via `-f` — never auto-merged). One-time setup: `docker network create edge` (it just needs to exist; no actual Caddy required). See `CLAUDE.md`'s Docker section for the full example and commands.

## Database Seeding

On a fresh database, the schema is created automatically on container startup (see `scripts/docker-auto-seed.mjs` for `dev`, `scripts/docker-ensure-schema.mjs` for `prod`, both documented in `CLAUDE.md`) — you don't need to do this manually. The routes below are for manually resetting or bootstrapping data afterward.

```bash
# Drops and recreates ALL tables, then inserts sample data (drops existing data!)
curl http://localhost:3000/seed
```

This will create:
- Sample companies (Danaul Inc., Goog)
- Sample users (regular user, super admin) — password `123456` for both
- Invitations table structure

**⚠️ Don't call this in production** — it's an unauthenticated `GET` route that wipes every table and reinserts a super admin with a well-known password. It exists for dev/demo convenience; for prod, create your first admin via `BOOTSTRAP_ADMIN_EMAIL`/`BOOTSTRAP_ADMIN_PASSWORD` instead (see [Production Deployment](#production-deployment)).

## Codebase Structure

### Actions Organization

Server actions are organized by domain:

```
/app/actions/
├── admin/
│   ├── user-actions.ts      # User management (CRUD, password, status)
│   ├── company-actions.ts    # Company management (super admin only)
│   └── invitation-actions.ts # Invitation management (create, accept, revoke)
├── auth.ts                  # Authentication actions
├── profile-actions.ts       # User profile management
└── settings-actions.ts      # User settings management
```

### Admin Dashboard

The admin dashboard is organized as follows:

```
/app/dashboard/admin/
├── page.tsx                 # Admin dashboard home
├── users/                   # User management
│   ├── page.tsx            # User list
│   ├── create/             # Create user
│   └── [id]/
│       ├── edit/           # Edit user
│       └── delete/         # Delete user
├── companies/              # Company management (super admin only)
│   ├── page.tsx            # Company list
│   ├── create/             # Create company
│   └── [id]/
│       ├── edit/           # Edit company
│       └── delete/         # Delete company
└── invitations/            # Invitation management
    ├── page.tsx            # Invitation list
    └── create/             # Create invitation
```

### Public Routes

```
/app/invite/[token]/        # Public invitation acceptance page
```

## User Roles and Permissions

### Super Admin
- Full system access
- Can manage all companies
- Can assign users to any company
- Can view and manage all users across all companies
- Profile shows "Super Admin" instead of company name

### Company Admin
- Scoped to their assigned company
- Can manage users within their company only
- Can send invitations to join their company
- Cannot change company assignments
- Profile shows their company name

### Regular User
- Basic user access
- Belongs to a company (or none)
- Can accept invitations to join companies
- Profile shows their company name (if assigned)

## Search Functionality

The admin dashboard includes comprehensive search functionality across all management pages:

### Features
- **Real-time Search**: Debounced search (300ms) to reduce API calls
- **URL-based Filtering**: Search queries are stored in URL parameters for shareable/bookmarkable links
- **Automatic Pagination Reset**: When searching, pagination resets to page 1
- **Responsive Design**: Search boxes work seamlessly on mobile and desktop

### Search Capabilities

**Users Page** (`/dashboard/admin/users`):
- Search by user name or email address
- Filters results in real-time as you type
- Works with existing status filters (active, inactive, admin)

**Companies Page** (`/dashboard/admin/companies` - Super Admin only):
- Search by company name or description
- Instant filtering of company list

**Invitations Page** (`/dashboard/admin/invitations`):
- Search by invitation email or company name
- Filters pending, accepted, expired, and revoked invitations

### Implementation
The search functionality uses a reusable `Search` component (`/app/ui/search.tsx`) that:
- Updates URL search parameters automatically
- Maintains search state across page navigation
- Provides consistent UX across all admin pages

## Invitation System

The application uses an invitation-based enrollment system:

1. **Admin sends invitation**: Company admins can invite users by email
2. **Invitation token**: A unique token is generated for each invitation
3. **Public acceptance**: Users visit `/invite/[token]` to accept
4. **Account creation**: New users create their account, existing users without a company can join
5. **Automatic assignment**: Users are automatically assigned to the inviting company

### Invitation Features
- 7-day expiration period
- Status tracking (pending, accepted, expired, revoked)
- Role assignment (member or admin)
- Email validation (prevents inviting users who already belong to a company)
- Copy invitation link functionality

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
