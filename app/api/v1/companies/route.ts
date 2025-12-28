import { NextRequest, NextResponse } from "next/server";
import { apiMiddleware, addCorsHeaders } from "@/app/lib/api-middleware";
import { query } from "@/app/lib/db";

/**
 * GET /api/v1/companies
 * List all companies (Super Admin only)
 */
export async function GET(request: NextRequest) {
  const middlewareResult = await apiMiddleware(request, { requireSuperAdmin: true });
  
  if (!middlewareResult.success) {
    return middlewareResult.response!;
  }
  
  try {
    const result = await query("SELECT * FROM companies ORDER BY name ASC");
    
    const response = NextResponse.json({
      success: true,
      data: result.rows,
    });
    
    return addCorsHeaders(response);
  } catch (error) {
    console.error("Get companies error:", error);
    const response = NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
    return addCorsHeaders(response);
  }
}

/**
 * POST /api/v1/companies
 * Create a new company (Super Admin only)
 */
export async function POST(request: NextRequest) {
  const middlewareResult = await apiMiddleware(request, { requireSuperAdmin: true });
  
  if (!middlewareResult.success) {
    return middlewareResult.response!;
  }
  
  try {
    const body = await request.json();
    const { name, description } = body;
    
    if (!name) {
      const response = NextResponse.json(
        { success: false, error: "Company name is required" },
        { status: 400 }
      );
      return addCorsHeaders(response);
    }
    
    const result = await query(
      "INSERT INTO companies (name, description) VALUES ($1, $2) RETURNING *",
      [name, description || null]
    );
    
    const response = NextResponse.json({
      success: true,
      data: result.rows[0],
    });
    
    return addCorsHeaders(response);
  } catch (error: unknown) {
    console.error("Create company error:", error);
    
    if (error && typeof error === 'object' && 'code' in error && error.code === '23505') { // Unique violation
      const response = NextResponse.json(
        { success: false, error: "Company with this name already exists" },
        { status: 409 }
      );
      return addCorsHeaders(response);
    }
    
    const response = NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
    return addCorsHeaders(response);
  }
}
