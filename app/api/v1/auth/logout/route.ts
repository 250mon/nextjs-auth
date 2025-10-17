import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { query } from "@/app/lib/db";
import { verifyApiToken, verifyRefreshToken } from "@/app/lib/jwt-service";

// Logout schema
const logoutSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const parsedData = logoutSchema.safeParse(body);
    if (!parsedData.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Invalid input", 
          details: parsedData.error.flatten().fieldErrors 
        },
        { status: 400 }
      );
    }

    const { refreshToken } = parsedData.data;

    // Verify refresh token to get user ID
    const payload = await verifyRefreshToken(refreshToken);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: "Invalid refresh token" },
        { status: 401 }
      );
    }

    // Remove refresh token from database
    await query(
      "DELETE FROM api_refresh_tokens WHERE token = $1",
      [refreshToken]
    );

    // Return success response
    return NextResponse.json({
      success: true,
      message: "Successfully logged out",
    });

  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Also support logout with Authorization header
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Authorization header required" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const payload = await verifyApiToken(token);
    
    if (!payload) {
      return NextResponse.json(
        { success: false, error: "Invalid token" },
        { status: 401 }
      );
    }

    // Remove all refresh tokens for this user
    await query(
      "DELETE FROM api_refresh_tokens WHERE user_id = $1",
      [payload.id]
    );

    return NextResponse.json({
      success: true,
      message: "Successfully logged out",
    });

  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
