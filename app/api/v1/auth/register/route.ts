import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { query } from "@/app/lib/db";
import { generateApiToken, generateRefreshToken } from "@/app/lib/jwt-service";

// Register schema
const registerSchema = z
  .object({
    email: z
      .string({ error: "Email is required" })
      .min(1, "Email required")
      .email("Invalid email"),
    password: z
      .string({ error: "Password is required" })
      .min(6, "Password must be more than 6 characters")
      .max(32, "Password must be less than 32 characters"),
    name: z
      .string({ error: "Name is required" })
      .min(3, "Name must be more than 3 characters")
      .max(100, "Name must be less than 100 characters"),
    confirm_password: z
      .string({ error: "Please confirm your password" })
      .min(6, "Password must be more than 6 characters")
      .max(32, "Password must be less than 32 characters"),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords must match",
    path: ["confirm_password"],
  });

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const parsedCredentials = registerSchema.safeParse(body);
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

    const { email, password, name } = parsedCredentials.data;

    // Check if user already exists
    const existingUser = await query("SELECT id FROM users WHERE email = $1", [email]);
    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { success: false, error: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate unique slug
    const baseSlug = name
      .toLowerCase()
      .replace(/\s+/g, "-");
    const uniqueId = Math.random().toString(36).substring(2, 8);
    const slug = `${baseSlug}-${uniqueId}`;

    // Insert user
    const userResult = await query(
      `INSERT INTO users (name, email, password, slug, isadmin, active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING id, name, email, isadmin, slug`,
      [name, email, hashedPassword, slug, false, true]
    );

    const newUser = userResult.rows[0];

    // Add user to default team if it exists
    try {
      const defaultTeamResult = await query(
        "SELECT id FROM teams WHERE name = $1",
        ["DefaultTeam"]
      );
      if (defaultTeamResult.rows.length > 0) {
        await query(
          "INSERT INTO user_teams (user_id, team_id, role, created_at) VALUES ($1, $2, $3, NOW())",
          [newUser.id, defaultTeamResult.rows[0].id, "member"]
        );
      }
    } catch (teamError) {
      console.log("Could not add user to default team:", teamError);
      // Don't fail registration if team assignment fails
    }

    // Generate tokens
    const accessToken = await generateApiToken({
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      isadmin: newUser.isadmin,
    });

    const refreshToken = await generateRefreshToken({
      id: newUser.id,
      email: newUser.email,
    });

    // Store refresh token in database
    await query(
      "INSERT INTO api_refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)",
      [newUser.id, refreshToken, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)] // 7 days
    );

    // Return success response
    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          isadmin: newUser.isadmin,
          slug: newUser.slug,
        },
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: 3600, // 1 hour
        },
      },
    }, { status: 201 });

  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
