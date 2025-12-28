'use server';

import { z } from 'zod';
import { adaptZodError } from '@/app/lib/zod-error-adaptor';
import { query, pool } from '@/app/lib/db';
import { getCurrentUser } from '@/app/lib/dal';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { Company } from '@/app/lib/definitions';

// Company management schemas
const CreateCompanySchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Company name is required'),
  description: z.string().nullable().optional(),
});

const UpdateCompanySchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Company name is required'),
  description: z.string().nullable().optional(),
});

// Utility function to check super admin permissions
async function requireSuperAdmin() {
  const currentUser = await getCurrentUser();
  if (!currentUser?.is_super_admin) {
    throw new Error('Super admin access required');
  }
  return currentUser;
}

// Fetch all companies
export async function fetchCompanies() {
  await requireSuperAdmin();
  
  try {
    const result = await query(`
      SELECT 
        id,
        name,
        description,
        created_at,
        updated_at
      FROM companies
      ORDER BY name ASC
    `);

    return result.rows as Company[];
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch companies.');
  }
}

// Fetch filtered companies with pagination
export async function fetchFilteredCompanies(
  searchQuery: string,
  currentPage: number
) {
  await requireSuperAdmin();
  
  const ITEMS_PER_PAGE = 10;
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;
  
  try {
    const result = await query(`
      SELECT 
        id,
        name,
        description,
        created_at,
        updated_at
      FROM companies
      WHERE name ILIKE $1 OR description ILIKE $1
      ORDER BY name ASC
      LIMIT $2 OFFSET $3
    `, [`%${searchQuery}%`, ITEMS_PER_PAGE, offset]);

    return result.rows as Company[];
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch companies.');
  }
}

// Get total count of companies for pagination
export async function fetchCompaniesPages(searchQuery: string) {
  await requireSuperAdmin();
  
  try {
    const result = await query(`
      SELECT COUNT(*)
      FROM companies
      WHERE name ILIKE $1 OR description ILIKE $1
    `, [`%${searchQuery}%`]);

    const totalPages = Math.ceil(Number(result.rows[0].count) / 10);
    return totalPages;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch company count.');
  }
}

// Get company by ID
export async function fetchCompanyById(id: string) {
  await requireSuperAdmin();
  
  try {
    const result = await query(`
      SELECT 
        id,
        name,
        description,
        created_at,
        updated_at
      FROM companies
      WHERE id = $1
    `, [id]);

    return result.rows[0] as Company | undefined;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch company.');
  }
}

// Company state type for forms
export type CompanyState = {
  errors: {
    id?: string[];
    name?: string[];
    description?: string[];
  };
  message: string;
};

// Create new company
export async function createCompany(prevState: CompanyState, formData: FormData) {
  await requireSuperAdmin();

  const description = formData.get('description');
  const validatedFields = CreateCompanySchema.safeParse({
    id: crypto.randomUUID(),
    name: formData.get('name'),
    description: description === '' || description === null ? null : String(description),
  });

  if (!validatedFields.success) {
    const adapted = adaptZodError(validatedFields.error);
    return {
      errors: {
        id: adapted.fieldErrors["id"] ? [adapted.fieldErrors["id"]] : undefined,
        name: adapted.fieldErrors["name"] ? [adapted.fieldErrors["name"]] : undefined,
        description: adapted.fieldErrors["description"] ? [adapted.fieldErrors["description"]] : undefined,
      },
      message: 'Missing Fields. Failed to create company.',
    };
  }

  const { id, name, description: desc } = validatedFields.data;

  try {
    // Check if company name already exists
    const existingCompany = await query(
      'SELECT id FROM companies WHERE name = $1',
      [name]
    );

    if (existingCompany.rows.length > 0) {
      return {
        message: 'Company with this name already exists.',
        errors: {},
      };
    }

    // Insert company
    await query(`
      INSERT INTO companies (id, name, description, created_at, updated_at)
      VALUES ($1, $2, $3, NOW(), NOW())
    `, [id, name, desc || null]);

  } catch (error) {
    console.error('Database Error:', error);
    
    if (error instanceof Error && 'code' in error && error.code === '23505') { // Unique violation
      return {
        message: 'Company with this name already exists.',
        errors: {},
      };
    }
    
    return {
      message: 'Database Error: Failed to create company.',
      errors: {},
    };
  }

  revalidatePath('/dashboard/admin/companies');
  redirect('/dashboard/admin/companies');
}

// Update company
export async function updateCompany(id: string, prevState: CompanyState, formData: FormData) {
  await requireSuperAdmin();

  const description = formData.get('description');
  const validatedFields = UpdateCompanySchema.safeParse({
    id,
    name: formData.get('name'),
    description: description === '' || description === null ? null : String(description),
  });

  if (!validatedFields.success) {
    const adapted = adaptZodError(validatedFields.error);
    return {
      errors: {
        id: adapted.fieldErrors["id"] ? [adapted.fieldErrors["id"]] : undefined,
        name: adapted.fieldErrors["name"] ? [adapted.fieldErrors["name"]] : undefined,
        description: adapted.fieldErrors["description"] ? [adapted.fieldErrors["description"]] : undefined,
      },
      message: 'Missing Fields. Failed to update company.',
    };
  }

  const { name, description: desc } = validatedFields.data;

  try {
    // Check if company name already exists for another company
    const existingCompany = await query(
      'SELECT id FROM companies WHERE name = $1 AND id != $2',
      [name, id]
    );

    if (existingCompany.rows.length > 0) {
      return {
        message: 'Company with this name already exists.',
        errors: {},
      };
    }

    // Update company
    await query(`
      UPDATE companies 
      SET name = $1, description = $2, updated_at = NOW()
      WHERE id = $3
    `, [name, desc || null, id]);

  } catch (error) {
    console.error('Database Error:', error);
    
    if (error instanceof Error && 'code' in error && error.code === '23505') { // Unique violation
      return {
        message: 'Company with this name already exists.',
        errors: {},
      };
    }
    
    return {
      message: 'Database Error: Failed to update company.',
      errors: {},
    };
  }

  revalidatePath('/dashboard/admin/companies');
  redirect('/dashboard/admin/companies');
}

// Delete company
export async function deleteCompany(id: string) {
  await requireSuperAdmin();

  try {
    // Check if company exists
    const companyToDelete = await fetchCompanyById(id);
    if (!companyToDelete) {
      return { message: 'Error: Company not found.', errors: {} };
    }

    // Check if there are users associated with this company
    const usersCount = await query(
      'SELECT COUNT(*) as count FROM users WHERE company_id = $1',
      [id]
    );
    const totalUsers = parseInt(usersCount.rows[0].count);

    // Start transaction to delete company and unlink users
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Update all users with this company_id to set it to NULL
      await client.query(
        'UPDATE users SET company_id = NULL WHERE company_id = $1',
        [id]
      );
      
      // Delete the company
      await client.query(
        'DELETE FROM companies WHERE id = $1',
        [id]
      );
      
      await client.query('COMMIT');
      
      revalidatePath('/dashboard/admin/companies');
      return { 
        message: `Company "${companyToDelete.name}" deleted successfully. ${totalUsers > 0 ? `${totalUsers} user(s) have been unlinked.` : ''}`, 
        errors: {} 
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Database Error:', error);
    
    // Handle specific database constraint errors
    if (error instanceof Error) {
      if (error.message.includes('foreign key constraint')) {
        return { message: 'Error: Cannot delete company due to database constraints.', errors: {} };
      }
      if (error.message.includes('violates')) {
        return { message: 'Error: Cannot delete company due to data integrity constraints.', errors: {} };
      }
    }
    
    return { message: 'Error: Failed to delete company.', errors: {} };
  }
}

