/**
 * NextAuth endpoint to get API token for current session
 * This bridges NextAuth sessions with the custom API service
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth.config";
import { generateApiToken } from "@/app/lib/jwt-service";

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

    // Generate API token from NextAuth session
    const apiToken = await generateApiToken({
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      isadmin: false, // You might want to add this to your NextAuth session
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
