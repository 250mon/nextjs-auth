import { NextRequest, NextResponse } from "next/server";
import { apiMiddleware, addCorsHeaders } from "@/app/lib/api-middleware";
import { query, pool } from "@/app/lib/db";

/**
 * GET /api/v1/companies/[id]
 * Get a single company (Super Admin only)
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
      "SELECT id, name, description, created_at, updated_at FROM companies WHERE id = $1",
      [id]
    );
    
    if (result.rows.length === 0) {
      const response = NextResponse.json(
        { success: false, error: "Company not found" },
        { status: 404 }
      );
      return addCorsHeaders(response);
    }
    
    const response = NextResponse.json({
      success: true,
      data: result.rows[0],
    });
    
    return addCorsHeaders(response);
  } catch (error) {
    console.error("Get company error:", error);
    const response = NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
    return addCorsHeaders(response);
  }
}

/**
 * PUT /api/v1/companies/[id]
 * Update a company (Super Admin only)
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
    const { name, description } = body;
    
    // Check if company exists
    const companyCheck = await query("SELECT id FROM companies WHERE id = $1", [id]);
    if (companyCheck.rows.length === 0) {
      const response = NextResponse.json(
        { success: false, error: "Company not found" },
        { status: 404 }
      );
      return addCorsHeaders(response);
    }
    
    // Build update query dynamically
    const updates: string[] = [];
    const values: (string | null)[] = [];
    let paramCount = 1;
    
    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description === "" ? null : description);
    }
    
    if (updates.length === 0) {
      const response = NextResponse.json(
        { success: false, error: "No fields to update" },
        { status: 400 }
      );
      return addCorsHeaders(response);
    }
    
    // Add updated_at and id to the query
    updates.push(`updated_at = NOW()`);
    values.push(id);
    
    const result = await query(
      `UPDATE companies SET ${updates.join(", ")} WHERE id = $${paramCount} RETURNING id, name, description, created_at, updated_at`,
      values
    );
    
    const response = NextResponse.json({
      success: true,
      data: result.rows[0],
    });
    
    return addCorsHeaders(response);
  } catch (error: unknown) {
    console.error("Update company error:", error);
    
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

/**
 * DELETE /api/v1/companies/[id]
 * Delete a company (Super Admin only)
 * Note: This will set company_id to NULL for all users associated with this company
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const middlewareResult = await apiMiddleware(request, { requireSuperAdmin: true });
  
  if (!middlewareResult.success) {
    return middlewareResult.response!;
  }
  
  const { id } = await params;
  
  const client = await pool.connect();
  
  try {
    // Check if company exists
    const companyCheck = await query("SELECT id FROM companies WHERE id = $1", [id]);
    if (companyCheck.rows.length === 0) {
      const response = NextResponse.json(
        { success: false, error: "Company not found" },
        { status: 404 }
      );
      return addCorsHeaders(response);
    }
    
    // Start a transaction to handle company deletion and user updates
    await client.query('BEGIN');
    
    try {
      // Update all users with this company_id to set it to NULL
      await client.query(
        "UPDATE users SET company_id = NULL WHERE company_id = $1",
        [id]
      );
      
      // Delete the company
      const result = await client.query(
        "DELETE FROM companies WHERE id = $1 RETURNING id, name",
        [id]
      );
      
      await client.query('COMMIT');
      
      const response = NextResponse.json({
        success: true,
        data: {
          deleted: result.rows[0],
          message: "Company deleted successfully. All associated users have been unlinked.",
        },
      });
      
      return addCorsHeaders(response);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error("Delete company error:", error);
    const response = NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
    return addCorsHeaders(response);
  } finally {
    client.release();
  }
}

