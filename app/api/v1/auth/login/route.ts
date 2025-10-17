import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { query } from "@/app/lib/db";
import { generateApiToken, generateRefreshToken } from "@/app/lib/jwt-service";
import type { User } from "@/app/lib/definitions";

// Login schema
const loginSchema = z.object({
  email: z
    .string({ error: "Email is required" })
    .min(1, "Email required")
    .email("Invalid email"),
  password: z
    .string({ error: "Password is required" })
    .min(6, "Password must be more than 6 characters")
    .max(32, "Password must be less than 32 characters"),
});

async function getUser(email: string): Promise<User | undefined> {
  try {
    const result = await query("SELECT * FROM users WHERE email = $1 AND active = true", [email]);
    return result.rows[0] as User;
  } catch (error) {
    console.error("Failed to fetch user:", error);
    return undefined;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const parsedCredentials = loginSchema.safeParse(body);
    if (!parsedCredentials.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Invalid input", 
          details: parsedCredentials.error.flatten().fieldErrors 
        },
        { status: 400 }
      );
    }

    const { email, password } = parsedCredentials.data;

    // Get user from database
    const user = await getUser(email);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Generate tokens
    const accessToken = await generateApiToken({
      id: user.id,
      email: user.email,
      name: user.name,
      isadmin: user.isadmin,
    });

    const refreshToken = await generateRefreshToken({
      id: user.id,
      email: user.email,
    });

    // Store refresh token in database
    await query(
      "INSERT INTO api_refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3) ON CONFLICT (user_id) DO UPDATE SET token = $2, expires_at = $3",
      [user.id, refreshToken, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)] // 7 days
    );

    // Return success response
    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          isadmin: user.isadmin,
          slug: user.slug,
        },
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: 3600, // 1 hour
        },
      },
    });

  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
