'use server';

import { z } from 'zod';
import { adaptZodError } from '@/app/lib/zod-error-adaptor';
import { query } from '@/app/lib/db';
import { getCurrentUser } from '@/app/lib/dal';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { User } from '@/app/lib/definitions';

// User management schemas
const CreateUserSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  isadmin: z.boolean(),
  slug: z.string().optional(),
  company_id: z.string().nullable().optional(),
});

const UpdateUserSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  isadmin: z.boolean(),
  active: z.boolean(),
  company_id: z.string().nullable().optional(),
});

const ChangeUserPasswordSchema = z.object({
  id: z.string(),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
});

// Utility function to check admin permissions
async function requireAdmin() {
  const currentUser = await getCurrentUser();
  if (!currentUser?.isadmin) {
    throw new Error('Admin access required');
  }
  return currentUser;
}

// Utility function to check super admin permissions (exported for use in other modules)
export async function requireSuperAdmin() {
  const currentUser = await getCurrentUser();
  if (!currentUser?.is_super_admin) {
    throw new Error('Super admin access required');
  }
  return currentUser;
}

// Fetch filtered users with pagination
export async function fetchFilteredUsers(
  searchQuery: string,
  currentPage: number,
  status: string = 'all'
) {
  const currentUser = await requireAdmin();
  
  const ITEMS_PER_PAGE = 10;
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;
  
  let whereClause = `WHERE (users.name ILIKE $1 OR users.email ILIKE $1)`;
  const params: (string | number)[] = [`%${searchQuery}%`];
  
  // Company isolation: Regular admins can only see users in their company
  if (!currentUser.is_super_admin) {
    if (!currentUser.company_id) {
      throw new Error('You must be associated with a company to view users');
    }
    whereClause += ` AND users.company_id = $${params.length + 1}`;
    params.push(currentUser.company_id);
  }
  
  if (status === 'active') {
    whereClause += ` AND users.active = true`;
  } else if (status === 'inactive') {
    whereClause += ` AND users.active = false`;
  } else if (status === 'admin') {
    whereClause += ` AND users.isadmin = true`;
  }
  
  params.push(ITEMS_PER_PAGE, offset);
  
  try {
    const result = await query(`
      SELECT 
        users.id,
        users.name,
        users.email,
        users.isadmin,
        users.slug,
        users.active,
        users.company_id,
        users.created_at,
        users.updated_at
      FROM users
      ${whereClause}
      ORDER BY users.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `, params);

    return result.rows as User[];
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch users.');
  }
}

// Get total count of users for pagination
export async function fetchUsersPages(searchQuery: string, status: string = 'all') {
  const currentUser = await requireAdmin();
  
  let whereClause = `WHERE (users.name ILIKE $1 OR users.email ILIKE $1)`;
  const params: (string | number)[] = [`%${searchQuery}%`];
  
  // Company isolation: Regular admins can only see users in their company
  if (!currentUser.is_super_admin) {
    if (!currentUser.company_id) {
      throw new Error('You must be associated with a company to view users');
    }
    whereClause += ` AND users.company_id = $${params.length + 1}`;
    params.push(currentUser.company_id);
  }
  
  if (status === 'active') {
    whereClause += ` AND users.active = true`;
  } else if (status === 'inactive') {
    whereClause += ` AND users.active = false`;
  } else if (status === 'admin') {
    whereClause += ` AND users.isadmin = true`;
  }
  
  try {
    const result = await query(`
      SELECT COUNT(*)
      FROM users
      ${whereClause}
    `, params);

    const totalPages = Math.ceil(Number(result.rows[0].count) / 10);
    return totalPages;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch user count.');
  }
}

// Get user by ID
export async function fetchUserById(id: string) {
  const currentUser = await requireAdmin();
  
  try {
    let queryText = `
      SELECT 
        users.id,
        users.name,
        users.email,
        users.isadmin,
        users.slug,
        users.active,
        users.company_id,
        users.created_at,
        users.updated_at
      FROM users
      WHERE users.id = $1
    `;
    const params: string[] = [id];
    
    // Company isolation: Regular admins can only access users in their company
    if (!currentUser.is_super_admin) {
      if (!currentUser.company_id) {
        throw new Error('You must be associated with a company to view users');
      }
      queryText += ` AND users.company_id = $2`;
      params.push(currentUser.company_id);
    }
    
    const result = await query(queryText, params);

    return result.rows[0] as User;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch user.');
  }
}

// User state type for forms
export type UserState = {
  errors: {
    id?: string[];
    name?: string[];
    email?: string[];
    password?: string[];
    isadmin?: string[];
    slug?: string[];
    active?: string[];
    newPassword?: string[];
    company_id?: string[];
  };
  message: string;
};

// Create new user
export async function createUser(prevState: UserState, formData: FormData) {
  await requireAdmin();

  const companyId = formData.get('company_id');
  const slugInput = formData.get('slug');
  const validatedFields = CreateUserSchema.safeParse({
    id: crypto.randomUUID(),
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
    isadmin: formData.get('isadmin') === 'true',
    slug: slugInput === '' || slugInput === null ? undefined : String(slugInput),
    company_id: companyId === '' || companyId === null ? null : String(companyId),
  });

  if (!validatedFields.success) {
    const adapted = adaptZodError(validatedFields.error);
    return {
      errors: {
        id: adapted.fieldErrors["id"] ? [adapted.fieldErrors["id"]] : undefined,
        name: adapted.fieldErrors["name"] ? [adapted.fieldErrors["name"]] : undefined,
        email: adapted.fieldErrors["email"] ? [adapted.fieldErrors["email"]] : undefined,
        password: adapted.fieldErrors["password"] ? [adapted.fieldErrors["password"]] : undefined,
        isadmin: adapted.fieldErrors["isadmin"] ? [adapted.fieldErrors["isadmin"]] : undefined,
        slug: adapted.fieldErrors["slug"] ? [adapted.fieldErrors["slug"]] : undefined,
        company_id: adapted.fieldErrors["company_id"] ? [adapted.fieldErrors["company_id"]] : undefined,
      },
      message: 'Missing Fields. Failed to create user.',
    };
  }

  const { id, name, email, password, isadmin, slug: providedSlug, company_id } = validatedFields.data;

  try {
    // Generate slug if not provided
    let slug = providedSlug;
    if (!slug || slug.trim() === '') {
      // Generate unique slug from name (similar to register route)
      const baseSlug = name
        .toLowerCase()
        .replace(/\s+/g, "-");
      const uniqueId = Math.random().toString(36).substring(2, 8);
      slug = `${baseSlug}-${uniqueId}`;
      
      // Check if generated slug exists and regenerate if needed
      let attempts = 0;
      const maxAttempts = 10;
      while (attempts < maxAttempts) {
        const slugCheck = await query(
          'SELECT id FROM users WHERE slug = $1',
          [slug]
        );
        
        if (slugCheck.rows.length === 0) {
          break; // Slug is unique, exit loop
        }
        
        // Regenerate with new random ID
        const newUniqueId = Math.random().toString(36).substring(2, 8);
        slug = `${baseSlug}-${newUniqueId}`;
        attempts++;
      }
      
      // Final fallback if still not unique after max attempts
      if (attempts >= maxAttempts) {
        slug = `${baseSlug}-${crypto.randomUUID().substring(0, 8)}`;
      }
    } else {
      // Validate provided slug format
      slug = slug.trim().toLowerCase();
      if (!/^[a-z0-9-]+$/.test(slug)) {
        return {
          message: 'Slug must contain only lowercase letters, numbers, and hyphens.',
          errors: {
            slug: ['Slug must contain only lowercase letters, numbers, and hyphens.'],
          },
        };
      }
      
      // Check if provided slug already exists
      const slugCheck = await query(
        'SELECT id FROM users WHERE slug = $1',
        [slug]
      );
      
      if (slugCheck.rows.length > 0) {
        return {
          message: 'This username (slug) is already taken.',
          errors: {
            slug: ['This username is already taken. Please choose another.'],
          },
        };
      }
    }

    // Check if email already exists
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return {
        message: 'Email already exists.',
        errors: {},
      };
    }

    // Company assignment logic
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return {
        message: 'Authentication required.',
        errors: {},
      };
    }
    
    let finalCompanyId: string | null = null;
    
    if (currentUser.is_super_admin) {
      // Super admins can assign any company
      if (company_id) {
        const companyCheck = await query('SELECT id FROM companies WHERE id = $1', [company_id]);
        if (companyCheck.rows.length === 0) {
          return {
            message: 'Selected company does not exist.',
            errors: {},
          };
        }
        finalCompanyId = company_id;
      }
    } else {
      // Regular admins can only create users in their own company
      if (!currentUser.company_id) {
        return {
          message: 'You must be associated with a company to create users.',
          errors: {},
        };
      }
      finalCompanyId = currentUser.company_id;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    await query(`
      INSERT INTO users (id, name, email, password, isadmin, slug, company_id, active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, true, NOW(), NOW())
    `, [id, name, email, hashedPassword, isadmin, slug, finalCompanyId || null]);

  } catch (error) {
    console.error('Database Error:', error);
    return {
      message: 'Database Error: Failed to create user.',
      errors: {},
    };
  }

  revalidatePath('/dashboard/admin/users');
  redirect('/dashboard/admin/users');
}

// Update user
export async function updateUser(id: string, prevState: UserState, formData: FormData) {
  await requireAdmin();

  const companyId = formData.get('company_id');
  const validatedFields = UpdateUserSchema.safeParse({
    id,
    name: formData.get('name'),
    email: formData.get('email'),
    isadmin: formData.get('isadmin') === 'true',
    active: formData.get('active') === 'true',
    company_id: companyId === '' || companyId === null ? null : String(companyId),
  });

  if (!validatedFields.success) {
    const adapted = adaptZodError(validatedFields.error);
    return {
      errors: {
        id: adapted.fieldErrors["id"] ? [adapted.fieldErrors["id"]] : undefined,
        name: adapted.fieldErrors["name"] ? [adapted.fieldErrors["name"]] : undefined,
        email: adapted.fieldErrors["email"] ? [adapted.fieldErrors["email"]] : undefined,
        isadmin: adapted.fieldErrors["isadmin"] ? [adapted.fieldErrors["isadmin"]] : undefined,
        active: adapted.fieldErrors["active"] ? [adapted.fieldErrors["active"]] : undefined,
        company_id: adapted.fieldErrors["company_id"] ? [adapted.fieldErrors["company_id"]] : undefined,
      },
      message: 'Missing Fields. Failed to update user.',
    };
  }

  const { name, email, isadmin, active, company_id } = validatedFields.data;

  try {
    const currentUser = await getCurrentUser();
    
    // Company isolation: Regular admins can only update users in their company
    if (!currentUser || !currentUser.is_super_admin) {
      if (!currentUser) {
        return {
          message: 'Authentication required.',
          errors: {},
        };
      }
      const userCheck = await query('SELECT company_id FROM users WHERE id = $1', [id]);
      if (userCheck.rows.length === 0) {
        return {
          message: 'User not found.',
          errors: {},
        };
      }
      const userCompanyId = userCheck.rows[0].company_id;
      if (currentUser.company_id !== userCompanyId) {
        return {
          message: 'You do not have permission to update this user.',
          errors: {},
        };
      }
    }
    
    // Check if email already exists for another user
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1 AND id != $2',
      [email, id]
    );

    if (existingUser.rows.length > 0) {
      return {
        message: 'Email already exists for another user.',
        errors: {},
      };
    }

    // Company assignment logic
    let finalCompanyId: string | null = null;
    if (currentUser && currentUser.is_super_admin) {
      // Super admins can assign any company or remove company assignment
      if (company_id && company_id !== '') {
        const companyCheck = await query('SELECT id FROM companies WHERE id = $1', [company_id]);
        if (companyCheck.rows.length === 0) {
          return {
            message: 'Selected company does not exist.',
            errors: {},
          };
        }
        finalCompanyId = company_id;
      } else {
        // Empty string or null means no company
        finalCompanyId = null;
      }
    } else {
      // Regular admins cannot change company_id - keep existing
      const userCheck = await query('SELECT company_id FROM users WHERE id = $1', [id]);
      if (userCheck.rows.length > 0) {
        finalCompanyId = userCheck.rows[0].company_id;
      }
    }

    // Update user basic info
    await query(`
      UPDATE users 
      SET name = $1, email = $2, isadmin = $3, active = $4, company_id = $5, updated_at = NOW()
      WHERE id = $6
    `, [name, email, isadmin, active, finalCompanyId, id]);

  } catch (error) {
    console.error('Database Error:', error);
    return {
      message: 'Database Error: Failed to update user.',
      errors: {},
    };
  }

  revalidatePath('/dashboard/admin/users');
  redirect('/dashboard/admin/users');
}

// Change user password
export async function changeUserPassword(id: string, prevState: UserState, formData: FormData) {
  await requireAdmin();

  const validatedFields = ChangeUserPasswordSchema.safeParse({
    id,
    newPassword: formData.get('newPassword'),
  });

  if (!validatedFields.success) {
    const adapted = adaptZodError(validatedFields.error);
    return {
      errors: {
        id: adapted.fieldErrors["id"] ? [adapted.fieldErrors["id"]] : undefined,
        newPassword: adapted.fieldErrors["newPassword"] ? [adapted.fieldErrors["newPassword"]] : undefined,
      },
      message: 'Invalid password.',
    };
  }

  const { newPassword } = validatedFields.data;

  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await query(`
      UPDATE users 
      SET password = $1, updated_at = NOW()
      WHERE id = $2
    `, [hashedPassword, id]);

  } catch (error) {
    console.error('Database Error:', error);
    return {
      message: 'Database Error: Failed to change password.',
      errors: {},
    };
  }

  revalidatePath('/dashboard/admin/users');
  return { message: 'Password changed successfully.', errors: {} };
}

// Toggle user active status
export async function toggleUserStatus(id: string) {
  const currentUser = await requireAdmin();

  try {
    // Company isolation: Regular admins can only toggle users in their company
    if (!currentUser.is_super_admin) {
      if (!currentUser.company_id) {
        throw new Error('You must be associated with a company to manage users');
      }
      const userCheck = await query('SELECT company_id FROM users WHERE id = $1', [id]);
      if (userCheck.rows.length === 0) {
        throw new Error('User not found');
      }
      if (userCheck.rows[0].company_id !== currentUser.company_id) {
        throw new Error('You do not have permission to update this user');
      }
    }
    
    await query(`
      UPDATE users 
      SET active = NOT active, updated_at = NOW()
      WHERE id = $1
    `, [id]);

  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to toggle user status.');
  }

  revalidatePath('/dashboard/admin/users');
}

// Delete user
export async function deleteUser(id: string) {
  const currentUser = await requireAdmin();

  try {
    // Don't allow deleting the current admin user
    if (currentUser.id === id) {
      return { message: 'Error: Cannot delete your own account.', errors: {} };
    }

    // Check if user exists and company isolation
    const userToDelete = await fetchUserById(id);
    if (!userToDelete) {
      return { message: 'Error: User not found.', errors: {} };
    }
    
    // Company isolation: Regular admins can only delete users in their company
    if (!currentUser.is_super_admin) {
      if (userToDelete.company_id !== currentUser.company_id) {
        return { message: 'Error: You do not have permission to delete this user.', errors: {} };
      }
    }

    // Check if this is the last admin user
    const adminCount = await query('SELECT COUNT(*) as count FROM users WHERE isadmin = true AND active = true');
    const totalAdmins = parseInt(adminCount.rows[0].count);
    
    if (userToDelete.isadmin && totalAdmins <= 1) {
      return { message: 'Error: Cannot delete the last active admin user.', errors: {} };
    }

    // Delete user
    await query('DELETE FROM users WHERE id = $1', [id]);
    
    revalidatePath('/dashboard/admin/users');
    return { message: `User "${userToDelete.name}" deleted successfully.`, errors: {} };

  } catch (error) {
    console.error('Database Error:', error);
    
    // Handle specific database constraint errors
    if (error instanceof Error) {
      if (error.message.includes('foreign key constraint')) {
        return { message: 'Error: Cannot delete user due to database constraints. User may have associated data.', errors: {} };
      }
      if (error.message.includes('violates')) {
        return { message: 'Error: Cannot delete user due to data integrity constraints.', errors: {} };
      }
    }
    
    return { message: 'Error: Failed to delete user.', errors: {} };
  }
}

