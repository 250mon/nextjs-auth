"use server";

import bcrypt from "bcryptjs";
import { users, companies } from "@/app/lib/placeholder-data";
import { pool, query } from "@/app/lib/db";

async function resetDatabase() {
  console.log("Starting database reset...");
  try {
    await query('DROP TABLE IF EXISTS api_refresh_tokens');
    await query('DROP TABLE IF EXISTS invitations');
    await query('DROP TABLE IF EXISTS users');
    console.log("Dropped users table");
    await query('DROP TABLE IF EXISTS companies');
    console.log("Dropped companies table");
    console.log("Database reset completed");
  } catch (error) {
    console.error("Error resetting database:", error);
    throw error;
  }
}

async function seedCompanies() {
  console.log("Starting companies seeding...");
  try {
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
    
    // Insert sample companies
    const insertedCompanies = await Promise.all(
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
    console.log(`Inserted ${insertedCompanies.length} company(ies)`);
    console.log("Companies seeding completed");
  } catch (error) {
    console.error("Error seeding companies:", error);
    throw error;
  }
}

async function seedInvitations() {
  console.log("Starting invitations seeding...");
  try {
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
    console.log("Invitations seeding completed");
  } catch (error) {
    console.error("Error seeding invitations:", error);
    throw error;
  }
}

async function seedUsers() {
  console.log("Starting users seeding...");
  try {
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
        settings JSONB DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const insertedUsers = await Promise.all(
      users.map(async (user) => {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        const slug = user.name.toLowerCase().replace(/\s+/g, '-');
        const settings = null; // Placeholder users don't have settings
        const createdAt = new Date().toISOString();
        const updatedAt = createdAt;
        return query(
          `INSERT INTO users (id, name, email, password, slug, isadmin, is_super_admin, company_id, active, settings, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, $9, $10, $11)
           ON CONFLICT (id) DO NOTHING`,
          [user.id, user.name, user.email, hashedPassword, slug, user.isadmin, user.is_super_admin, user.company_id, settings, createdAt, updatedAt]
        );
      })
    );
    console.log("Users seeding completed");
    return insertedUsers;
  } catch (error) {
    console.error("Error seeding users:", error);
    throw error;
  }
}

export async function GET() {
  console.log("Starting database seeding process...");
  const client = await pool.connect();
  
  try {
    console.log("Starting transaction...");
    await client.query('BEGIN');
    console.log("Transaction started successfully");
    
    // Reset the database first
    await resetDatabase();
    
    // Then seed the data in the correct order
    await seedCompanies();
    await seedInvitations();
    await seedUsers();
    
    console.log("All seeding operations completed, committing transaction...");
    await client.query('COMMIT');
    console.log("Transaction committed successfully");

    return Response.json({ message: "Database reset and seeded successfully" });
  } catch (error) {
    console.error("Error during seeding:", error);
    if (error instanceof Error) {
      console.error("Error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
    try {
      console.log("Attempting to rollback transaction...");
      await client.query('ROLLBACK');
      console.log("Transaction rolled back successfully");
    } catch (rollbackError) {
      console.error("Error during rollback:", rollbackError);
    }
    return Response.json({ 
      error: error instanceof Error ? error.message : "Unknown error occurred",
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  } finally {
    client.release();
  }
}