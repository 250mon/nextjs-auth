import { NextResponse } from "next/server";
import { query } from "@/app/lib/db";

export async function POST() {
  try {
    // Create api_refresh_tokens table if it doesn't exist
    await query(`
      CREATE TABLE IF NOT EXISTS api_refresh_tokens (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        token TEXT NOT NULL UNIQUE,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Create index for faster lookups
    await query(`
      CREATE INDEX IF NOT EXISTS idx_api_refresh_tokens_user_id 
      ON api_refresh_tokens(user_id)
    `);
    
    await query(`
      CREATE INDEX IF NOT EXISTS idx_api_refresh_tokens_token 
      ON api_refresh_tokens(token)
    `);
    
    await query(`
      CREATE INDEX IF NOT EXISTS idx_api_refresh_tokens_expires_at 
      ON api_refresh_tokens(expires_at)
    `);
    
    // Clean up expired tokens
    await query(`
      DELETE FROM api_refresh_tokens 
      WHERE expires_at < NOW()
    `);
    
    return NextResponse.json({
      success: true,
      message: "API setup completed successfully",
    });
    
  } catch (error) {
    console.error("API setup error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to setup API" },
      { status: 500 }
    );
  }
}
