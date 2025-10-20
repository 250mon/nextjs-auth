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
  slug: z.string().min(1, 'Slug is required'),
});

const UpdateUserSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  isadmin: z.boolean(),
  active: z.boolean(),
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

// Fetch filtered users with pagination
export async function fetchFilteredUsers(
  searchQuery: string,
  currentPage: number,
  status: string = 'all'
) {
  await requireAdmin();
  
  const ITEMS_PER_PAGE = 10;
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;
  
  let whereClause = `WHERE (users.name ILIKE $1 OR users.email ILIKE $1)`;
  const params: (string | number)[] = [`%${searchQuery}%`];
  
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
        users.created_at,
        users.updated_at,
        COALESCE(
          json_agg(
            json_build_object(
              'id', teams.id,
              'name', teams.name,
              'description', teams.description,
              'role', user_teams.role
            )
          ) FILTER (WHERE teams.id IS NOT NULL),
          '[]'::json
        ) as teams
      FROM users
      LEFT JOIN user_teams ON users.id = user_teams.user_id
      LEFT JOIN teams ON user_teams.team_id = teams.id
      ${whereClause}
      GROUP BY users.id, users.name, users.email, users.isadmin, users.slug, users.active, users.created_at, users.updated_at
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
  await requireAdmin();
  
  let whereClause = `WHERE (users.name ILIKE $1 OR users.email ILIKE $1)`;
  const params: (string | number)[] = [`%${searchQuery}%`];
  
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
  await requireAdmin();
  
  try {
    const result = await query(`
      SELECT 
        users.id,
        users.name,
        users.email,
        users.isadmin,
        users.slug,
        users.active,
        users.created_at,
        users.updated_at,
        COALESCE(
          json_agg(
            json_build_object(
              'id', teams.id,
              'name', teams.name,
              'description', teams.description,
              'role', user_teams.role
            )
          ) FILTER (WHERE teams.id IS NOT NULL),
          '[]'::json
        ) as teams
      FROM users
      LEFT JOIN user_teams ON users.id = user_teams.user_id
      LEFT JOIN teams ON user_teams.team_id = teams.id
      WHERE users.id = $1
      GROUP BY users.id, users.name, users.email, users.isadmin, users.slug, users.active, users.created_at, users.updated_at
    `, [id]);

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
  };
  message: string;
};

// Create new user
export async function createUser(prevState: UserState, formData: FormData) {
  await requireAdmin();

  const validatedFields = CreateUserSchema.safeParse({
    id: crypto.randomUUID(),
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
    isadmin: formData.get('isadmin') === 'true',
    slug: formData.get('slug'),
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
      },
      message: 'Missing Fields. Failed to create user.',
    };
  }

  const { id, name, email, password, isadmin, slug } = validatedFields.data;

  // Get selected teams
  const selectedTeams = formData.getAll('selectedTeams').map(id => parseInt(id as string)).filter(id => !isNaN(id));

  try {
    // Check if email or slug already exists
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1 OR slug = $2',
      [email, slug]
    );

    if (existingUser.rows.length > 0) {
      return {
        message: 'Email or slug already exists.',
        errors: {},
      };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Start transaction
    await query('BEGIN');

    // Insert user
    await query(`
      INSERT INTO users (id, name, email, password, isadmin, slug, active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, true, NOW(), NOW())
    `, [id, name, email, hashedPassword, isadmin, slug]);

    // Add user to selected teams
    if (selectedTeams.length > 0) {
      const teamValues = selectedTeams.map((_, index) => 
        `($1, $${index + 2}, 'member', NOW())`
      ).join(', ');
      
      await query(`
        INSERT INTO user_teams (user_id, team_id, role, created_at)
        VALUES ${teamValues}
      `, [id, ...selectedTeams]);
    }

    await query('COMMIT');

  } catch (error) {
    await query('ROLLBACK');
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

  const validatedFields = UpdateUserSchema.safeParse({
    id,
    name: formData.get('name'),
    email: formData.get('email'),
    isadmin: formData.get('isadmin') === 'true',
    active: formData.get('active') === 'true',
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
      },
      message: 'Missing Fields. Failed to update user.',
    };
  }

  const { name, email, isadmin, active } = validatedFields.data;

  // Get selected teams
  const selectedTeams = formData.getAll('selectedTeams').map(id => parseInt(id as string)).filter(id => !isNaN(id));

  try {
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

    // Start transaction
    await query('BEGIN');

    // Update user basic info
    await query(`
      UPDATE users 
      SET name = $1, email = $2, isadmin = $3, active = $4, updated_at = NOW()
      WHERE id = $5
    `, [name, email, isadmin, active, id]);

    // Update user teams - remove all existing and add new ones
    await query('DELETE FROM user_teams WHERE user_id = $1', [id]);
    
    if (selectedTeams.length > 0) {
      const teamValues = selectedTeams.map((_, index) => 
        `($1, $${index + 2}, 'member', NOW())`
      ).join(', ');
      
      await query(`
        INSERT INTO user_teams (user_id, team_id, role, created_at)
        VALUES ${teamValues}
      `, [id, ...selectedTeams]);
    }

    await query('COMMIT');

  } catch (error) {
    await query('ROLLBACK');
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
  await requireAdmin();

  try {
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
  await requireAdmin();

  try {
    // Don't allow deleting the current admin user
    const currentUser = await getCurrentUser();
    if (currentUser?.id === id) {
      return { message: 'Error: Cannot delete your own account.', errors: {} };
    }

    // Check if user exists
    const userToDelete = await fetchUserById(id);
    if (!userToDelete) {
      return { message: 'Error: User not found.', errors: {} };
    }

    // Check if this is the last admin user
    const adminCount = await query('SELECT COUNT(*) as count FROM users WHERE isadmin = true AND active = true');
    const totalAdmins = parseInt(adminCount.rows[0].count);
    
    if (userToDelete.isadmin && totalAdmins <= 1) {
      return { message: 'Error: Cannot delete the last active admin user.', errors: {} };
    }

    // Start transaction for data integrity
    await query('BEGIN');

    // Delete user (this will cascade delete user_teams due to foreign key constraint)
    await query('DELETE FROM users WHERE id = $1', [id]);

    await query('COMMIT');
    
    revalidatePath('/dashboard/admin/users');
    return { message: `User "${userToDelete.name}" deleted successfully.`, errors: {} };

  } catch (error) {
    await query('ROLLBACK');
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
