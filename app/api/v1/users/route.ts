import { NextRequest, NextResponse } from "next/server";
import { apiMiddleware, addCorsHeaders } from "@/app/lib/api-middleware";
import { query } from "@/app/lib/db";

export async function GET(request: NextRequest) {
  const middlewareResult = await apiMiddleware(request, { requireAdmin: true });
  
  if (!middlewareResult.success) {
    return middlewareResult.response!;
  }
  
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const offset = (page - 1) * limit;
    
    // Build query
    let whereClause = "";
    const queryParams: string[] = [];
    
    if (search) {
      whereClause = "WHERE u.name ILIKE $1 OR u.email ILIKE $1";
      queryParams.push(`%${search}%`);
    }
    
    // Get total count
    const countQuery = `SELECT COUNT(*) FROM users u ${whereClause}`;
    const countResult = await query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].count);
    
    // Get users with company information
    const usersQuery = `
      SELECT u.id, u.name, u.email, u.isadmin, u.is_super_admin, u.company_id, u.slug, u.active, u.created_at, u.updated_at,
             c.id as company_id_full, c.name as company_name, c.description as company_description
      FROM users u
      LEFT JOIN companies c ON u.company_id = c.id
      ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `;
    
    const usersResult = await query(usersQuery, [...queryParams, limit, offset]);
    
    const users = usersResult.rows.map(user => ({
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
      company: user.company_id_full ? {
        id: user.company_id_full,
        name: user.company_name,
        description: user.company_description,
      } : null,
    }));
    
    const response = NextResponse.json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
    
    return addCorsHeaders(response);
    
  } catch (error) {
    console.error("Get users error:", error);
    const response = NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
    return addCorsHeaders(response);
  }
}
