This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

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

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
