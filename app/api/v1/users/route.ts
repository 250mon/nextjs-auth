import { NextRequest, NextResponse } from "next/server";
import { apiMiddleware, addCorsHeaders } from "@/app/lib/api-middleware";
import { query } from "@/app/lib/db";
import { z } from "zod";
import bcrypt from "bcryptjs";

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

// Schema for creating a new user
const createUserSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters").max(100),
  company_id: z.string().uuid().optional().nullable(),
  isadmin: z.boolean().optional().default(false),
});

/**
 * POST /api/v1/users
 * Create a new user (Admin only)
 * The user will be created with must_change_password = true
 */
export async function POST(request: NextRequest) {
  const middlewareResult = await apiMiddleware(request, { requireAdmin: true });

  if (!middlewareResult.success) {
    return middlewareResult.response!;
  }

  const origin = request.headers.get("origin");

  try {
    const body = await request.json();

    // Validate input
    const parseResult = createUserSchema.safeParse(body);
    if (!parseResult.success) {
      const response = NextResponse.json(
        {
          success: false,
          error: "Invalid input",
          details: {
            fieldErrors: parseResult.error.flatten().fieldErrors,
          }
        },
        { status: 400 }
      );
      return addCorsHeaders(response, origin || undefined);
    }

    const { name, email, password, company_id, isadmin } = parseResult.data;

    // Check if user with this email already exists
    const existingUser = await query(
      "SELECT id FROM users WHERE LOWER(email) = LOWER($1)",
      [email]
    );

    if (existingUser.rows.length > 0) {
      const response = NextResponse.json(
        { success: false, error: "User with this email already exists" },
        { status: 409 }
      );
      return addCorsHeaders(response, origin || undefined);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate slug from name
    const baseSlug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const uniqueId = Math.random().toString(36).substring(2, 8);
    const slug = `${baseSlug}-${uniqueId}`;

    // Determine company_id: use provided one, or inherit from admin creating the user
    const finalCompanyId = company_id || middlewareResult.user?.company_id || null;

    // Insert user with must_change_password = true
    const result = await query(
      `INSERT INTO users (name, email, password, slug, isadmin, company_id, active, must_change_password, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, true, true, NOW(), NOW())
       RETURNING id, name, email, isadmin, is_super_admin, company_id, slug, active, must_change_password, created_at, updated_at`,
      [name, email, hashedPassword, slug, isadmin, finalCompanyId]
    );

    const newUser = result.rows[0];

    // Get company info if available
    let company = null;
    if (newUser.company_id) {
      const companyResult = await query(
        "SELECT id, name, description FROM companies WHERE id = $1",
        [newUser.company_id]
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
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          isadmin: newUser.isadmin,
          is_super_admin: newUser.is_super_admin,
          company_id: newUser.company_id,
          slug: newUser.slug,
          active: newUser.active,
          must_change_password: newUser.must_change_password,
          createdAt: newUser.created_at,
          updatedAt: newUser.updated_at,
          company: company,
        },
      },
    }, { status: 201 });

    return addCorsHeaders(response, origin || undefined);

  } catch (error) {
    console.error("Create user error:", error);
    const response = NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
    return addCorsHeaders(response, origin || undefined);
  }
}
