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

### Quick Start

1. **Set up environment variables**:
   
   Ensure you have `.env.development` and `.env.production` files in your project root with the required variables:
   
   **`.env.development`** (for development):
   ```bash
   POSTGRES_URL=postgresql://user:password@host:port/database
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
   AUTH_SECRET=your-nextauth-secret-change-this-in-production
   NODE_ENV=development
   DEBUG=true
   ```
   
   **`.env.production`** (for production):
   ```bash
   POSTGRES_URL=postgresql://user:password@host:port/database
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
   AUTH_SECRET=your-nextauth-secret-change-this-in-production
   NODE_ENV=production
   DEBUG=false
   ```

2. **Build and start the application**:
   ```bash
   # For development (uses .env.development)
   docker-compose --profile dev up -d
   
   # For production (uses .env.production)
   docker-compose --profile prod up -d
   ```

3. **Initialize the database**:
   ```bash
   # Wait for the app to start, then run:
   curl -X POST http://localhost:3000/api/v1/auth/setup
   ```

4. **Access the application**:
   - Application: http://localhost:3000

### Docker Commands

- **Start development environment**: `docker-compose --profile dev up -d`
- **Start production environment**: `docker-compose --profile prod up -d`
- **Stop application**: `docker-compose --profile dev down` or `docker-compose --profile prod down`
- **View logs**: `docker-compose --profile dev logs -f` or `docker-compose --profile prod logs -f`
- **Rebuild after changes**: `docker-compose --profile dev up -d --build` or `docker-compose --profile prod up -d --build`

### Environment Variables

The docker-compose.yml uses **profiles** to automatically load the correct environment file:
- **`dev` profile**: Loads `.env.development`
- **`prod` profile**: Loads `.env.production`

Key environment variables (must be set in your `.env.development` and `.env.production` files):

- `POSTGRES_URL` - **Required** - Full PostgreSQL connection string (e.g., `postgresql://user:password@host:port/database`)
- `JWT_SECRET` - Secret for JWT tokens (⚠️ CHANGE IN PRODUCTION!)
- `JWT_REFRESH_SECRET` - Secret for refresh tokens (⚠️ CHANGE IN PRODUCTION!)
- `AUTH_SECRET` - NextAuth secret (⚠️ CHANGE IN PRODUCTION!)
- `ALLOWED_ORIGINS` - CORS allowed origins (default: `*`)
- `APP_PORT` - Application port (default: `3000`)
- `NODE_ENV` - Node environment (`development` for dev, `production` for prod)
- `DEBUG` - Enable debug logging (`true` for dev, `false` for prod)

**Note**: The `env_file` directive in docker-compose.yml automatically loads variables from the appropriate `.env` file based on the profile you use. Next.js will also read these files inside the container based on `NODE_ENV`.

### Production Deployment

For production, make sure to:

1. Set strong, unique secrets for `JWT_SECRET`, `JWT_REFRESH_SECRET`, and `AUTH_SECRET`
2. Configure `ALLOWED_ORIGINS` with specific domains (not `*`)
3. Use environment-specific `.env` files or Docker secrets
4. Ensure your external PostgreSQL database has SSL/TLS enabled
5. Set up proper backup strategies for your external PostgreSQL database
6. Use a secure connection string format: `postgresql://user:password@host:port/database?sslmode=require`

## Database Seeding

The application includes a seeding route to initialize the database with sample data:

```bash
# Seed the database with initial data
curl http://localhost:3000/seed
```

This will create:
- Sample companies (Danaul Inc., Goog)
- Sample users (regular user, super admin, standalone user)
- Invitations table structure

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
