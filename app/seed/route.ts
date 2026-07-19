"use server";

import { pool } from "@/app/lib/db";
import { resetDatabase, seedCompanies, seedInvitations, seedUsers } from "@/app/lib/seed";

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
