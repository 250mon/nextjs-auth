'use server';

import { z } from 'zod';
import { adaptZodError } from '@/app/lib/zod-error-adaptor';
import { query } from '@/app/lib/db';
import { getCurrentUser } from '@/app/lib/dal';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { Invitation } from '@/app/lib/definitions';
import * as crypto from 'crypto';

// Invitation management schemas
const CreateInvitationSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.string().default('member'),
  company_id: z.string().uuid('Invalid company ID'),
});

const AcceptInvitationSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  name: z.string().min(1, 'Name is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Password confirmation is required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Utility function to check admin permissions
async function requireAdmin() {
  const currentUser = await getCurrentUser();
  if (!currentUser?.isadmin) {
    throw new Error('Admin access required');
  }
  return currentUser;
}

// Generate secure random token
function generateInvitationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Fetch invitations for current admin's company
export async function fetchInvitations(searchQuery: string = '') {
  const currentUser = await requireAdmin();
  
  // Regular admins can only see invitations for their company
  // Super admins can see all invitations
  let whereClause = '';
  const params: string[] = [];
  let paramCount = 1;
  
  // Build where clause for company isolation
  if (!currentUser.is_super_admin) {
    if (!currentUser.company_id) {
      throw new Error('You must be associated with a company to view invitations');
    }
    whereClause = `WHERE i.company_id = $${paramCount}`;
    params.push(currentUser.company_id);
    paramCount++;
  }
  
  // Add search filter
  if (searchQuery) {
    if (whereClause) {
      whereClause += ` AND (i.email ILIKE $${paramCount} OR c.name ILIKE $${paramCount})`;
    } else {
      whereClause = `WHERE (i.email ILIKE $${paramCount} OR c.name ILIKE $${paramCount})`;
    }
    params.push(`%${searchQuery}%`);
  }
  
  try {
    const result = await query(`
      SELECT 
        i.id,
        i.email,
        i.company_id,
        i.role,
        i.token,
        i.status,
        i.expires_at,
        i.created_at,
        i.updated_at,
        c.name as company_name
      FROM invitations i
      LEFT JOIN companies c ON i.company_id = c.id
      ${whereClause}
      ORDER BY i.created_at DESC
    `, params.length > 0 ? params : undefined);

    return result.rows as (Invitation & { company_name?: string })[];
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invitations.');
  }
}

// Get invitation by token (for public acceptance)
export async function getInvitationByToken(token: string) {
  try {
    const result = await query(`
      SELECT 
        i.id,
        i.email,
        i.company_id,
        i.role,
        i.token,
        i.status,
        i.expires_at,
        i.created_at,
        i.updated_at,
        c.name as company_name
      FROM invitations i
      LEFT JOIN companies c ON i.company_id = c.id
      WHERE i.token = $1
    `, [token]);

    if (result.rows.length === 0) {
      return null;
    }

    const invitation = result.rows[0] as Invitation & { company_name?: string };
    
    // Check if invitation is expired
    if (new Date(invitation.expires_at) < new Date()) {
      // Update status to expired
      await query(
        'UPDATE invitations SET status = $1, updated_at = NOW() WHERE id = $2',
        ['expired', invitation.id]
      );
      invitation.status = 'expired';
    }

    // Check if user already exists for this email
    const userCheck = await query(
      'SELECT id, name, company_id FROM users WHERE email = $1',
      [invitation.email.toLowerCase()]
    );

    if (userCheck.rows.length > 0) {
      const user = userCheck.rows[0];
      return {
        ...invitation,
        existingUser: {
          id: user.id,
          name: user.name,
          hasCompany: user.company_id !== null && user.company_id !== undefined,
        },
      };
    }

    return invitation;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invitation.');
  }
}

// Invitation state type for forms
export type InvitationState = {
  errors: {
    email?: string[];
    role?: string[];
    company_id?: string[];
  };
  message: string;
};

// Create new invitation
export async function createInvitation(prevState: InvitationState, formData: FormData) {
  const currentUser = await requireAdmin();

  const email = formData.get('email');
  const role = formData.get('role') || 'member';
  
  // Determine company_id based on admin type
  let companyId: string;
  if (currentUser.is_super_admin) {
    const providedCompanyId = formData.get('company_id');
    if (!providedCompanyId || providedCompanyId === '') {
      return {
        message: 'Company is required.',
        errors: {
          company_id: ['Company is required.'],
        },
      };
    }
    companyId = String(providedCompanyId);
  } else {
    // Regular admins can only invite to their own company
    if (!currentUser.company_id) {
      return {
        message: 'You must be associated with a company to send invitations.',
        errors: {},
      };
    }
    companyId = currentUser.company_id;
  }

  const validatedFields = CreateInvitationSchema.safeParse({
    email,
    role,
    company_id: companyId,
  });

  if (!validatedFields.success) {
    const adapted = adaptZodError(validatedFields.error);
    return {
      errors: {
        email: adapted.fieldErrors["email"] ? [adapted.fieldErrors["email"]] : undefined,
        role: adapted.fieldErrors["role"] ? [adapted.fieldErrors["role"]] : undefined,
        company_id: adapted.fieldErrors["company_id"] ? [adapted.fieldErrors["company_id"]] : undefined,
      },
      message: 'Missing Fields. Failed to create invitation.',
    };
  }

  const { email: validatedEmail, role: validatedRole, company_id } = validatedFields.data;

  try {
    // Check if user already exists with this email
    const existingUser = await query(
      'SELECT id, company_id FROM users WHERE email = $1',
      [validatedEmail.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      const user = existingUser.rows[0];
      // If user exists and belongs to a company, reject the invitation
      if (user.company_id !== null && user.company_id !== undefined) {
        return {
          message: 'A user with this email already exists and belongs to a company.',
          errors: {
            email: ['A user with this email already exists and belongs to a company.'],
          },
        };
      }
      // If user exists but doesn't belong to any company, allow the invitation
      // This allows inviting users who were created without a company
    }

    // Check if there's already a pending invitation for this email and company
    const existingInvitation = await query(
      'SELECT id FROM invitations WHERE email = $1 AND company_id = $2 AND status = $3',
      [validatedEmail.toLowerCase(), company_id, 'pending']
    );

    if (existingInvitation.rows.length > 0) {
      return {
        message: 'A pending invitation already exists for this email.',
        errors: {
          email: ['A pending invitation already exists for this email.'],
        },
      };
    }

    // Generate token and expiration (7 days from now)
    const token = generateInvitationToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Insert invitation
    await query(`
      INSERT INTO invitations (email, company_id, role, token, status, expires_at, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
    `, [validatedEmail.toLowerCase(), company_id, validatedRole, token, 'pending', expiresAt]);

  } catch (error) {
    console.error('Database Error:', error);
    return {
      message: 'Database Error: Failed to create invitation.',
      errors: {},
    };
  }

  revalidatePath('/dashboard/admin/invitations');
  redirect('/dashboard/admin/invitations');
}

// Revoke invitation
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function revokeInvitation(id: string, _prevState: unknown, _formData: FormData) {
  await requireAdmin();

  try {
    const currentUser = await getCurrentUser();
    
    // Check if invitation exists and belongs to admin's company (unless super admin)
    const invitationCheck = await query(
      'SELECT company_id FROM invitations WHERE id = $1',
      [id]
    );

    if (invitationCheck.rows.length === 0) {
      revalidatePath('/dashboard/admin/invitations');
      return;
    }

    const invitationCompanyId = invitationCheck.rows[0].company_id;

    // Regular admins can only revoke invitations for their company
    if (!currentUser?.is_super_admin && currentUser?.company_id !== invitationCompanyId) {
      revalidatePath('/dashboard/admin/invitations');
      return;
    }

    // Update invitation status
    await query(`
      UPDATE invitations 
      SET status = $1, updated_at = NOW()
      WHERE id = $2
    `, ['revoked', id]);

    revalidatePath('/dashboard/admin/invitations');
  } catch (error) {
    console.error('Database Error:', error);
  }
}

// Accept invitation state type
export type AcceptInvitationState = {
  errors: {
    token?: string[];
    name?: string[];
    password?: string[];
    confirmPassword?: string[];
    email?: string[];
  };
  message: string;
};

// Accept invitation without password (for existing users)
export async function acceptInvitationSimple(token: string): Promise<AcceptInvitationState> {
  try {
    // Get invitation by token
    const invitation = await getInvitationByToken(token);

    if (!invitation) {
      return {
        message: 'Invalid invitation token.',
        errors: {
          token: ['Invalid invitation token.'],
        },
      };
    }

    // Check invitation status
    if (invitation.status !== 'pending') {
      return {
        message: `This invitation has been ${invitation.status}.`,
        errors: {
          token: [`This invitation has been ${invitation.status}.`],
        },
      };
    }

    // Check if invitation is expired
    if (new Date(invitation.expires_at) < new Date()) {
      await query(
        'UPDATE invitations SET status = $1, updated_at = NOW() WHERE id = $2',
        ['expired', invitation.id]
      );
      return {
        message: 'This invitation has expired.',
        errors: {
          token: ['This invitation has expired.'],
        },
      };
    }

    // Check if user exists and doesn't belong to a company
    const existingUser = await query(
      'SELECT id, company_id FROM users WHERE email = $1',
      [invitation.email.toLowerCase()]
    );

    if (existingUser.rows.length === 0) {
      return {
        message: 'User account not found. Please use the full registration form.',
        errors: {
          email: ['User account not found. Please use the full registration form.'],
        },
      };
    }

    const user = existingUser.rows[0];
    
    // If user exists and belongs to a company, reject
    if (user.company_id !== null && user.company_id !== undefined) {
      return {
        message: 'You already belong to a company.',
        errors: {
          email: ['You already belong to a company.'],
        },
      };
    }

    // Update existing user with company and role
    await query(`
      UPDATE users 
      SET company_id = $1, isadmin = $2, updated_at = NOW()
      WHERE id = $3
    `, [
      invitation.company_id,
      invitation.role === 'admin',
      user.id,
    ]);

    // Update invitation status
    await query(
      'UPDATE invitations SET status = $1, updated_at = NOW() WHERE id = $2',
      ['accepted', invitation.id]
    );

    revalidatePath('/invite');
    return {
      message: 'You have successfully joined the company! You can now log in.',
      errors: {},
    };
  } catch (error) {
    console.error('Database Error:', error);
    return {
      message: 'Database Error: Failed to accept invitation.',
      errors: {},
    };
  }
}

// Accept invitation and create user
export async function acceptInvitation(prevState: AcceptInvitationState, formData: FormData) {
  const token = formData.get('token');
  const name = formData.get('name');
  const password = formData.get('password');
  const confirmPassword = formData.get('confirmPassword');

  const validatedFields = AcceptInvitationSchema.safeParse({
    token,
    name,
    password,
    confirmPassword,
  });

  if (!validatedFields.success) {
    const adapted = adaptZodError(validatedFields.error);
    return {
      errors: {
        token: adapted.fieldErrors["token"] ? [adapted.fieldErrors["token"]] : undefined,
        name: adapted.fieldErrors["name"] ? [adapted.fieldErrors["name"]] : undefined,
        password: adapted.fieldErrors["password"] ? [adapted.fieldErrors["password"]] : undefined,
        confirmPassword: adapted.fieldErrors["confirmPassword"] ? [adapted.fieldErrors["confirmPassword"]] : undefined,
      },
      message: 'Missing Fields. Failed to accept invitation.',
    };
  }

  const { token: validatedToken, name: validatedName, password: validatedPassword } = validatedFields.data;

  try {
    // Get invitation by token
    const invitation = await getInvitationByToken(validatedToken);

    if (!invitation) {
      return {
        message: 'Invalid invitation token.',
        errors: {
          token: ['Invalid invitation token.'],
        },
      };
    }

    // Check invitation status
    if (invitation.status !== 'pending') {
      return {
        message: `This invitation has been ${invitation.status}.`,
        errors: {
          token: [`This invitation has been ${invitation.status}.`],
        },
      };
    }

    // Check if invitation is expired
    if (new Date(invitation.expires_at) < new Date()) {
      await query(
        'UPDATE invitations SET status = $1, updated_at = NOW() WHERE id = $2',
        ['expired', invitation.id]
      );
      return {
        message: 'This invitation has expired.',
        errors: {
          token: ['This invitation has expired.'],
        },
      };
    }

    // Check if user already exists and belongs to a company
    const existingUser = await query(
      'SELECT id, company_id FROM users WHERE email = $1',
      [invitation.email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      const user = existingUser.rows[0];
      // If user exists and belongs to a company, reject
      if (user.company_id !== null && user.company_id !== undefined) {
        return {
          message: 'A user with this email already exists and belongs to a company.',
          errors: {
            email: ['A user with this email already exists and belongs to a company.'],
          },
        };
      }
      // If user exists but doesn't belong to a company, update their company_id and name
      const userId = user.id;
      
      // Update existing user with company, role, and name
      await query(`
        UPDATE users 
        SET name = $1, company_id = $2, isadmin = $3, updated_at = NOW()
        WHERE id = $4
      `, [
        validatedName,
        invitation.company_id,
        invitation.role === 'admin',
        userId,
      ]);

      // Update invitation status
      await query(
        'UPDATE invitations SET status = $1, updated_at = NOW() WHERE id = $2',
        ['accepted', invitation.id]
      );

      revalidatePath('/invite');
      return {
        message: 'You have successfully joined the company! You can now log in with your existing password.',
        errors: {},
      };
    }

    // Hash password (only needed for new users)
    const bcrypt = await import('bcryptjs');
    const hashedPassword = validatedPassword ? await bcrypt.hash(validatedPassword, 10) : null;

    // Generate unique slug
    const baseSlug = validatedName
      .toLowerCase()
      .replace(/\s+/g, "-");
    const uniqueId = Math.random().toString(36).substring(2, 8);
    let slug = `${baseSlug}-${uniqueId}`;

    // Ensure slug is unique
    let attempts = 0;
    while (attempts < 10) {
      const slugCheck = await query('SELECT id FROM users WHERE slug = $1', [slug]);
      if (slugCheck.rows.length === 0) {
        break;
      }
      const newUniqueId = Math.random().toString(36).substring(2, 8);
      slug = `${baseSlug}-${newUniqueId}`;
      attempts++;
    }

    // Create user
    const userId = crypto.randomUUID();
    await query(`
      INSERT INTO users (id, name, email, password, slug, isadmin, is_super_admin, company_id, active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, NOW(), NOW())
    `, [
      userId,
      validatedName,
      invitation.email.toLowerCase(),
      hashedPassword,
      slug,
      invitation.role === 'admin', // Set isadmin based on role
      false, // Never set super_admin via invitation
      invitation.company_id,
    ]);

    // Update invitation status
    await query(
      'UPDATE invitations SET status = $1, updated_at = NOW() WHERE id = $2',
      ['accepted', invitation.id]
    );

    revalidatePath('/invite');
    return {
      message: 'Account created successfully! You can now log in.',
      errors: {},
    };
  } catch (error) {
    console.error('Database Error:', error);
    return {
      message: 'Database Error: Failed to accept invitation.',
      errors: {},
    };
  }
}

