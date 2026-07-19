import bcrypt from "bcryptjs";

// Creates the first super admin from BOOTSTRAP_ADMIN_EMAIL/BOOTSTRAP_ADMIN_PASSWORD
// if (and only if) no super admin exists yet. Safe to call on every startup.
export async function ensureBootstrapAdmin(pool) {
  const { rows } = await pool.query(
    "SELECT count(*)::int AS count FROM users WHERE is_super_admin = true"
  );
  if (rows[0].count > 0) {
    console.log("[bootstrap-admin] a super admin already exists, skipping.");
    return;
  }

  const email = process.env.BOOTSTRAP_ADMIN_EMAIL;
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;

  if (!email && !password) {
    console.warn(
      "[bootstrap-admin] No super admin exists yet and BOOTSTRAP_ADMIN_EMAIL/BOOTSTRAP_ADMIN_PASSWORD are not set — skipping. Set both env vars to auto-create the first admin."
    );
    return;
  }

  if (!email || !password) {
    throw new Error(
      "[bootstrap-admin] BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD must both be set (only one was provided)."
    );
  }

  if (password.length < 6 || password.length > 100) {
    throw new Error(
      "[bootstrap-admin] BOOTSTRAP_ADMIN_PASSWORD must be between 6 and 100 characters."
    );
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const slug = email.split("@")[0].toLowerCase().replace(/[^a-z0-9-]/g, "-");

  await pool.query(
    `INSERT INTO users (name, email, password, slug, isadmin, is_super_admin, company_id, active, must_change_password)
     VALUES ('Admin', $1, $2, $3, true, true, NULL, true, true)
     ON CONFLICT (email) DO NOTHING`,
    [email, hashedPassword, slug]
  );
  console.log(`[bootstrap-admin] Created initial super admin '${email}' — must_change_password is set, so they'll be required to change it on first login.`);
}
