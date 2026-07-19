// Runs before `node server.js` starts in the prod container (wired in via
// docker-compose.yml's `command:` for auth-app-prod). Creates the schema if
// missing, then creates the first super admin from BOOTSTRAP_ADMIN_EMAIL /
// BOOTSTRAP_ADMIN_PASSWORD if no super admin exists yet. Both steps are
// idempotent — safe to run on every container start.
import { Pool } from "pg";
import { ensureSchema } from "./schema.mjs";
import { ensureBootstrapAdmin } from "./bootstrap-admin.mjs";

const databaseSsl = process.env.DATABASE_SSL?.toLowerCase();
const ssl = databaseSsl === "true" || databaseSsl === "require"
  ? { rejectUnauthorized: false }
  : false;

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl,
});

async function main() {
  await ensureSchema(pool);
  await ensureBootstrapAdmin(pool);
  await pool.end();
}

main().catch((error) => {
  console.error("[ensure-schema] Failed:", error);
  process.exit(1);
});
