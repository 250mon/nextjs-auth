// Runs before `next dev` starts (wired in via docker-compose.yml's `command:`
// for auth-app-dev). Creates the schema and sample users on a fresh dev DB
// volume; no-ops if the `users` table already exists. Plain Node/pg — kept
// outside the Next.js app so it never touches the webpack/edge bundling
// that instrumentation.ts hooks would go through.
//
// Sample data mirrors app/lib/placeholder-data.ts — keep the two in sync.
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import { ensureSchema } from "./schema.mjs";

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: false,
});

const companies = [
  {
    id: "550e8400-e29b-41d4-a716-446655440000",
    name: "Danaul",
    description: "Sample company for multi-tenant demonstration",
  },
  {
    id: "660e8400-e29b-41d4-a716-446655440001",
    name: "Goog",
    description: "Another sample company",
  },
];

const users = [
  {
    id: "410544b2-4001-4271-9855-fec4b6a6442a",
    name: "User",
    email: "user@nextmail.com",
    password: "123456",
    isadmin: false,
    is_super_admin: false,
    company_id: "550e8400-e29b-41d4-a716-446655440000",
    slug: "user",
  },
  {
    id: "410544b2-4001-4271-9855-fec4b6a6442b",
    name: "Admin",
    email: "admin@danaul.ai",
    password: "123456",
    isadmin: true,
    is_super_admin: true,
    company_id: null,
    slug: "admin",
  },
];

async function main() {
  const { rows } = await pool.query("SELECT to_regclass('public.users') AS exists");
  if (rows[0].exists) {
    console.log("[auto-seed] users table already exists, skipping.");
    await pool.end();
    return;
  }

  console.log("[auto-seed] No tables found — creating schema and sample data...");

  await ensureSchema(pool);

  for (const company of companies) {
    await pool.query(
      `INSERT INTO companies (id, name, description) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING`,
      [company.id, company.name, company.description]
    );
  }

  for (const user of users) {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    await pool.query(
      `INSERT INTO users (id, name, email, password, slug, isadmin, is_super_admin, company_id, active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
       ON CONFLICT (id) DO NOTHING`,
      [user.id, user.name, user.email, hashedPassword, user.slug, user.isadmin, user.is_super_admin, user.company_id]
    );
  }

  console.log("[auto-seed] Done.");
  await pool.end();
}

main().catch((error) => {
  console.error("[auto-seed] Failed:", error);
  process.exit(1);
});
