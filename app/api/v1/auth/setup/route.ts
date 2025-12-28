import { NextRequest, NextResponse } from "next/server";
import { query } from "@/app/lib/db";
import { addCorsHeaders } from "@/app/lib/api-middleware";

export async function POST(request: NextRequest) {
  try {
    const origin = request.headers.get("origin");
    // Create api_refresh_tokens table if it doesn't exist
    await query(`
      CREATE TABLE IF NOT EXISTS api_refresh_tokens (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL UNIQUE,
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
    
    const response = NextResponse.json({
      success: true,
      message: "API setup completed successfully",
    });
    return addCorsHeaders(response, origin || undefined);
    
  } catch (error) {
    console.error("API setup error:", error);
    
    // Handle specific error types
    let errorMessage = "Failed to setup API";
    let statusCode = 500;
    
    if (error instanceof Error) {
      if (error.message.includes("connect") || error.message.includes("ECONNREFUSED")) {
        errorMessage = "Database connection failed";
        statusCode = 503;
      } else if (error.message.includes("timeout")) {
        errorMessage = "Request timeout";
        statusCode = 504;
      } else if (error.message.includes("permission") || error.message.includes("access")) {
        errorMessage = "Database permission denied";
        statusCode = 403;
      }
    }
    
    const response = NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        ...(process.env.NODE_ENV === 'development' && { 
          details: error instanceof Error ? error.message : String(error) 
        })
      },
      { status: statusCode }
    );
    return addCorsHeaders(response, request.headers.get("origin") || undefined);
  }
}
