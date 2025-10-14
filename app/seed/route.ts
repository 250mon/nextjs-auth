"use server";

import bcrypt from "bcryptjs";
import { users } from "@/app/lib/placeholder-data";
import { pool, query } from "@/app/lib/db";

async function resetDatabase() {
  console.log("Starting database reset...");
  try {
    await query('DROP TABLE IF EXISTS users');
    console.log("Dropped users table");
    console.log("Database reset completed");
  } catch (error) {
    console.error("Error resetting database:", error);
    throw error;
  }
}

async function seedUsers() {
  console.log("Starting users seeding...");
  try {
    await query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        isadmin BOOLEAN DEFAULT FALSE,
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
        const settings = user.settings ? JSON.stringify(user.settings) : null;
        const createdAt = new Date().toISOString();
        const updatedAt = createdAt;
        return query(
          `INSERT INTO users (id, name, email, password, slug, isadmin, active, settings, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, true, $7, $8, $9)
           ON CONFLICT (id) DO NOTHING`,
          [user.id, user.name, user.email, hashedPassword, slug, user.isadmin, settings, createdAt, updatedAt]
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
    await seedUsers();
    await seedTeams();
    await seedUserTeams();
    await seedTeamPermissions();
    await seedCategories();
    await seedItems();
    await seedSKUs();
    await seedTransactionTypes();
    await seedTransactions();
    
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