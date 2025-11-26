import { NextRequest, NextResponse } from "next/server";
import { apiMiddleware, addCorsHeaders } from "@/app/lib/api-middleware";
import { query } from "@/app/lib/db";

export async function GET(request: NextRequest) {
  const middlewareResult = await apiMiddleware(request, { requireAuth: true });
  
  if (!middlewareResult.success) {
    return middlewareResult.response!;
  }
  
  if (!middlewareResult.user) {
    return NextResponse.json(
      { success: false, error: "User not found" },
      { status: 404 }
    );
  }
  
  try {
    // Get user data
    const userResult = await query(
      `SELECT u.id, u.name, u.email, u.isadmin, u.slug, u.active, u.created_at, u.updated_at
       FROM users u
       WHERE u.id = $1`,
      [middlewareResult.user.id]
    );
    
    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }
    
    const user = userResult.rows[0];
    
    const response = NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          isadmin: user.isadmin,
          slug: user.slug,
          active: user.active,
          createdAt: user.created_at,
          updatedAt: user.updated_at,
        },
      },
    });
    
    return addCorsHeaders(response);
    
  } catch (error) {
    console.error("Get user error:", error);
    const response = NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
    return addCorsHeaders(response);
  }
}

export async function PUT(request: NextRequest) {
  const middlewareResult = await apiMiddleware(request, { requireAuth: true });
  
  if (!middlewareResult.success) {
    return middlewareResult.response!;
  }
  
  if (!middlewareResult.user) {
    return NextResponse.json(
      { success: false, error: "User not found" },
      { status: 404 }
    );
  }
  
  try {
    const body = await request.json();
    const { name, email } = body;
    
    // Validate input
    if (!name || !email) {
      return NextResponse.json(
        { success: false, error: "Name and email are required" },
        { status: 400 }
      );
    }
    
    // Check if email is already taken by another user
    const existingUser = await query(
      "SELECT id FROM users WHERE email = $1 AND id != $2",
      [email, middlewareResult.user.id]
    );
    
    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { success: false, error: "Email already taken" },
        { status: 409 }
      );
    }
    
    // Update user
    const result = await query(
      "UPDATE users SET name = $1, email = $2, updated_at = NOW() WHERE id = $3 RETURNING id, name, email, isadmin, slug, active, created_at, updated_at",
      [name, email, middlewareResult.user.id]
    );
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }
    
    const user = result.rows[0];
    
    const response = NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          isadmin: user.isadmin,
          slug: user.slug,
          active: user.active,
          createdAt: user.created_at,
          updatedAt: user.updated_at,
        },
      },
    });
    
    return addCorsHeaders(response);
    
  } catch (error) {
    console.error("Update user error:", error);
    const response = NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
    return addCorsHeaders(response);
  }
}
