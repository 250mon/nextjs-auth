import { NextRequest, NextResponse } from "next/server";
import { apiMiddleware, addCorsHeaders } from "@/app/lib/api-middleware";
import { query } from "@/app/lib/db";

/**
 * PUT /api/v1/users/[id]
 * Update user details (Super Admin only)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const middlewareResult = await apiMiddleware(request, { requireSuperAdmin: true });
  
  if (!middlewareResult.success) {
    return middlewareResult.response!;
  }
  
  const { id } = await params;
  
  try {
    const body = await request.json();
    const { isadmin, is_super_admin, company_id, active } = body;
    
    // Check if user exists
    const userCheck = await query("SELECT id FROM users WHERE id = $1", [id]);
    if (userCheck.rows.length === 0) {
      const response = NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
      return addCorsHeaders(response);
    }
    
    // Build update query dynamically
    const updates: string[] = [];
    const values: (string | boolean)[] = [];
    let paramCount = 1;
    
    if (isadmin !== undefined) {
      updates.push(`isadmin = $${paramCount++}`);
      values.push(isadmin);
    }
    
    if (is_super_admin !== undefined) {
      updates.push(`is_super_admin = $${paramCount++}`);
      values.push(is_super_admin);
    }
    
    if (company_id !== undefined) {
      updates.push(`company_id = $${paramCount++}`);
      values.push(company_id === "" ? null : company_id);
    }
    
    if (active !== undefined) {
      updates.push(`active = $${paramCount++}`);
      values.push(active);
    }
    
    if (updates.length === 0) {
      const response = NextResponse.json(
        { success: false, error: "No fields to update" },
        { status: 400 }
      );
      return addCorsHeaders(response);
    }
    
    values.push(id);
    const result = await query(
      `UPDATE users SET ${updates.join(", ")}, updated_at = NOW() WHERE id = $${paramCount} RETURNING id, name, email, isadmin, is_super_admin, company_id, active`,
      values
    );
    
    const response = NextResponse.json({
      success: true,
      data: result.rows[0],
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

/**
 * GET /api/v1/users/[id]
 * Get user details (Super Admin only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const middlewareResult = await apiMiddleware(request, { requireSuperAdmin: true });
  
  if (!middlewareResult.success) {
    return middlewareResult.response!;
  }
  
  const { id } = await params;
  
  try {
    const result = await query(
      `SELECT u.id, u.name, u.email, u.isadmin, u.is_super_admin, u.company_id, u.slug, u.active, u.created_at, u.updated_at,
              c.id as company_id_full, c.name as company_name, c.description as company_description
       FROM users u
       LEFT JOIN companies c ON u.company_id = c.id
       WHERE u.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      const response = NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
      return addCorsHeaders(response);
    }
    
    const user = result.rows[0];
    
    // Build company object if user has a company
    const company = user.company_id_full ? {
      id: user.company_id_full,
      name: user.company_name,
      description: user.company_description,
    } : null;
    
    const response = NextResponse.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        isadmin: user.isadmin,
        is_super_admin: user.is_super_admin,
        company_id: user.company_id,
        slug: user.slug,
        active: user.active,
        created_at: user.created_at,
        updated_at: user.updated_at,
        company: company,
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
