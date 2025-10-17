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
    
    // Get users
    const usersQuery = `
      SELECT u.id, u.name, u.email, u.isadmin, u.slug, u.active, u.created_at, u.updated_at,
             COUNT(ut.team_id) as team_count
      FROM users u
      LEFT JOIN user_teams ut ON u.id = ut.user_id
      ${whereClause}
      GROUP BY u.id, u.name, u.email, u.isadmin, u.slug, u.active, u.created_at, u.updated_at
      ORDER BY u.created_at DESC
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `;
    
    const usersResult = await query(usersQuery, [...queryParams, limit, offset]);
    
    const users = usersResult.rows.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      isadmin: user.isadmin,
      slug: user.slug,
      active: user.active,
      teamCount: parseInt(user.team_count),
      createdAt: user.created_at,
      updatedAt: user.updated_at,
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
