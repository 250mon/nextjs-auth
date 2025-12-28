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
    // Get user data with company information
    const userResult = await query(
      `SELECT u.id, u.name, u.email, u.isadmin, u.is_super_admin, u.company_id, u.slug, u.active, u.created_at, u.updated_at,
              c.id as company_id_full, c.name as company_name, c.description as company_description
       FROM users u
       LEFT JOIN companies c ON u.company_id = c.id
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
    
    // Build company object if user has a company
    const company = user.company_id_full ? {
      id: user.company_id_full,
      name: user.company_name,
      description: user.company_description,
    } : null;
    
    const response = NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          isadmin: user.isadmin,
          is_super_admin: user.is_super_admin,
          company_id: user.company_id,
          slug: user.slug,
          active: user.active,
          createdAt: user.created_at,
          updatedAt: user.updated_at,
          company: company,
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
      "UPDATE users SET name = $1, email = $2, updated_at = NOW() WHERE id = $3 RETURNING id, name, email, isadmin, is_super_admin, company_id, slug, active, created_at, updated_at",
      [name, email, middlewareResult.user.id]
    );
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }
    
    const user = result.rows[0];
    
    // Get company information if user has a company
    let company = null;
    if (user.company_id) {
      const companyResult = await query(
        "SELECT id, name, description FROM companies WHERE id = $1",
        [user.company_id]
      );
      if (companyResult.rows.length > 0) {
        company = {
          id: companyResult.rows[0].id,
          name: companyResult.rows[0].name,
          description: companyResult.rows[0].description,
        };
      }
    }
    
    const response = NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          isadmin: user.isadmin,
          is_super_admin: user.is_super_admin,
          company_id: user.company_id,
          slug: user.slug,
          active: user.active,
          createdAt: user.created_at,
          updatedAt: user.updated_at,
          company: company,
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
