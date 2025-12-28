/**
 * NextAuth endpoint to get API token for current session
 * This bridges NextAuth sessions with the custom API service
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth.config";
import { generateApiToken } from "@/app/lib/jwt-service";
import { query } from "@/app/lib/db";
import type { User } from "@/app/lib/definitions";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_request: NextRequest) {
  try {
    // Get current NextAuth session
    const session = await auth();
    
    if (!session?.user?.id || !session.user.email || !session.user.name) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Fetch full user data from database to get is_super_admin and company_id
    const userResult = await query(
      "SELECT id, email, name, isadmin, is_super_admin, company_id FROM users WHERE id = $1",
      [session.user.id]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const user = userResult.rows[0] as User;

    // Generate API token from user data
    const apiToken = await generateApiToken({
      id: user.id,
      email: user.email,
      name: user.name,
      isadmin: user.isadmin,
      is_super_admin: user.is_super_admin,
      company_id: user.company_id,
    });

    return NextResponse.json({
      success: true,
      data: {
        apiToken,
        user: {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
        },
      },
    });

  } catch (error) {
    console.error("API token generation error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
