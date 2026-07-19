import bcrypt from "bcryptjs";
import { users, companies } from "@/app/lib/placeholder-data";
import { query } from "@/app/lib/db";

export async function resetDatabase() {
  console.log("Starting database reset...");
  await query('DROP TABLE IF EXISTS api_refresh_tokens');
  await query('DROP TABLE IF EXISTS invitations');
  await query('DROP TABLE IF EXISTS users');
  await query('DROP TABLE IF EXISTS companies');
  console.log("Database reset completed");
}

export async function seedCompanies() {
  await query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
  await query(`
    CREATE TABLE IF NOT EXISTS companies (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await Promise.all(
    companies.map(async (company) => {
      const createdAt = company.created_at.toISOString();
      const updatedAt = company.updated_at.toISOString();
      return query(
        `INSERT INTO companies (id, name, description, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO NOTHING`,
        [company.id, company.name, company.description, createdAt, updatedAt]
      );
    })
  );
}

export async function seedInvitations() {
  await query(`
    CREATE TABLE IF NOT EXISTS invitations (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      email VARCHAR(255) NOT NULL,
      company_id UUID NOT NULL REFERENCES companies(id),
      role VARCHAR(50) DEFAULT 'member',
      token VARCHAR(255) NOT NULL UNIQUE,
      status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

export async function seedUsers() {
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      isadmin BOOLEAN DEFAULT FALSE,
      is_super_admin BOOLEAN DEFAULT FALSE,
      company_id UUID REFERENCES companies(id),
      active BOOLEAN DEFAULT TRUE,
      must_change_password BOOLEAN DEFAULT FALSE,
      settings JSONB DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await Promise.all(
    users.map(async (user) => {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      const slug = user.name.toLowerCase().replace(/\s+/g, '-');
      const createdAt = new Date().toISOString();
      return query(
        `INSERT INTO users (id, name, email, password, slug, isadmin, is_super_admin, company_id, active, settings, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, $9, $10, $10)
         ON CONFLICT (id) DO NOTHING`,
        [user.id, user.name, user.email, hashedPassword, slug, user.isadmin, user.is_super_admin, user.company_id, null, createdAt]
      );
    })
  );
}
