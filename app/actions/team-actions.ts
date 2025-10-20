'use server';

import { z } from 'zod';
import { adaptZodError } from '@/app/lib/zod-error-adaptor';
import { query } from '@/app/lib/db';
import { getCurrentUser } from '@/app/lib/dal';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { Team } from '@/app/lib/definitions';

// Team management schemas
const CreateTeamSchema = z.object({
  name: z.string().min(1, 'Team name is required'),
  description: z.string().optional(),
});

const UpdateTeamSchema = z.object({
  id: z.number(),
  name: z.string().min(1, 'Team name is required'),
  description: z.string().optional(),
});


// Utility function to check admin permissions
async function requireAdmin() {
  const currentUser = await getCurrentUser();
  if (!currentUser?.isadmin) {
    throw new Error('Admin access required');
  }
  return currentUser;
}

// Fetch all teams
export async function fetchAllTeams(): Promise<Team[]> {
  try {
    const result = await query(`
      SELECT id, name, description, created_at, updated_at
      FROM teams
      ORDER BY name ASC
    `);

    return result.rows as Team[];
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch teams.');
  }
}

// Fetch teams for a specific user
export async function fetchUserTeams(userId: string): Promise<Team[]> {
  try {
    const result = await query(`
      SELECT t.id, t.name, t.description, t.created_at, t.updated_at
      FROM teams t
      INNER JOIN user_teams ut ON t.id = ut.team_id
      WHERE ut.user_id = $1
      ORDER BY t.name ASC
    `, [userId]);

    return result.rows as Team[];
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch user teams.');
  }
}

// Fetch users in a specific team
export async function fetchTeamUsers(teamId: number) {
  try {
    const result = await query(`
      SELECT u.id, u.name, u.email, u.slug, ut.role, ut.created_at as joined_at
      FROM users u
      INNER JOIN user_teams ut ON u.id = ut.user_id
      WHERE ut.team_id = $1
      ORDER BY u.name ASC
    `, [teamId]);

    return result.rows;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch team users.');
  }
}

// Add user to team
export async function addUserToTeam(userId: string, teamId: number, role?: string) {
  await requireAdmin();

  try {
    await query(`
      INSERT INTO user_teams (user_id, team_id, role, created_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (user_id, team_id) DO UPDATE SET role = $3
    `, [userId, teamId, role || 'member']);

    revalidatePath('/dashboard/admin/users');
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to add user to team.');
  }
}

// Remove user from team
export async function removeUserFromTeam(userId: string, teamId: number) {
  await requireAdmin();

  try {
    await query(`
      DELETE FROM user_teams
      WHERE user_id = $1 AND team_id = $2
    `, [userId, teamId]);

    revalidatePath('/dashboard/admin/users');
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to remove user from team.');
  }
}

// Update user's teams (replace all teams for a user)
export async function updateUserTeams(userId: string, teamIds: number[], role?: string) {
  await requireAdmin();

  await query('BEGIN');
  
  try {
    // Remove all existing team memberships
    await query('DELETE FROM user_teams WHERE user_id = $1', [userId]);
    
    // Add new team memberships
    if (teamIds.length > 0) {
      const values = teamIds.map((teamId, index) => 
        `($1, $${index + 2}, $${teamIds.length + 2}, NOW())`
      ).join(', ');
      
      const params = [userId, ...teamIds, role || 'member'];
      
      await query(`
        INSERT INTO user_teams (user_id, team_id, role, created_at)
        VALUES ${values}
      `, params);
    }
    
    await query('COMMIT');
    revalidatePath('/dashboard/admin/users');
  } catch (error) {
    await query('ROLLBACK');
    console.error('Database Error:', error);
    throw new Error('Failed to update user teams.');
  }
}

// Create new team
export async function createTeam(name: string, description?: string) {
  await requireAdmin();

  const validatedFields = CreateTeamSchema.safeParse({ name, description });

  if (!validatedFields.success) {
    throw new Error('Invalid team data');
  }

  try {
    const result = await query(`
      INSERT INTO teams (name, description, created_at, updated_at)
      VALUES ($1, $2, NOW(), NOW())
      RETURNING id
    `, [name, description]);

    return result.rows[0].id;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to create team.');
  }
}

// Update team
export async function updateTeam(id: number, name: string, description?: string) {
  await requireAdmin();

  const validatedFields = UpdateTeamSchema.safeParse({ id, name, description });

  if (!validatedFields.success) {
    throw new Error('Invalid team data');
  }

  try {
    await query(`
      UPDATE teams 
      SET name = $1, description = $2, updated_at = NOW()
      WHERE id = $3
    `, [name, description, id]);

    revalidatePath('/dashboard/admin');
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to update team.');
  }
}

// Delete team
export async function deleteTeam(id: number) {
  await requireAdmin();

  try {
    // Check if team has users
    const teamUsers = await query('SELECT COUNT(*) FROM user_teams WHERE team_id = $1', [id]);
    
    if (parseInt(teamUsers.rows[0].count) > 0) {
      throw new Error('Cannot delete team with existing members');
    }

    await query('DELETE FROM teams WHERE id = $1', [id]);
    revalidatePath('/dashboard/admin/teams');
    revalidatePath('/dashboard/admin');
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to delete team.');
  }
}

// Get team by ID
export async function fetchTeamById(id: number): Promise<Team | null> {
  try {
    const result = await query(`
      SELECT id, name, description, created_at, updated_at
      FROM teams
      WHERE id = $1
    `, [id]);

    return result.rows[0] as Team || null;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch team.');
  }
}

// Team management state type
export type TeamState = {
  errors: {
    name?: string[];
    description?: string[];
  };
  message: string;
};

// Server actions for team management
export async function createTeamAction(prevState: TeamState, formData: FormData): Promise<TeamState> {
  await requireAdmin();

  const name = formData.get('name') as string;
  const description = formData.get('description') as string || '';

  const validatedFields = z.object({
    name: z.string().min(1, 'Team name is required'),
    description: z.string().optional(),
  }).safeParse({ name, description });

  if (!validatedFields.success) {
    const adapted = adaptZodError(validatedFields.error);
    return {
      errors: {
        name: adapted.fieldErrors["name"] ? [adapted.fieldErrors["name"]] : undefined,
        description: adapted.fieldErrors["description"] ? [adapted.fieldErrors["description"]] : undefined,
      },
      message: 'Missing Fields. Failed to create team.',
    };
  }

  try {
    await createTeam(name, description);
  } catch (error) {
    console.error('Database Error:', error);
    return {
      message: 'Database Error: Failed to create team.',
      errors: {},
    };
  }

  revalidatePath('/dashboard/admin/teams');
  redirect('/dashboard/admin/teams');
}

export async function updateTeamAction(id: number, prevState: TeamState, formData: FormData): Promise<TeamState> {
  await requireAdmin();

  const name = formData.get('name') as string;
  const description = formData.get('description') as string || '';

  const validatedFields = z.object({
    name: z.string().min(1, 'Team name is required'),
    description: z.string().optional(),
  }).safeParse({ name, description });

  if (!validatedFields.success) {
    const adapted = adaptZodError(validatedFields.error);
    return {
      errors: {
        name: adapted.fieldErrors["name"] ? [adapted.fieldErrors["name"]] : undefined,
        description: adapted.fieldErrors["description"] ? [adapted.fieldErrors["description"]] : undefined,
      },
      message: 'Missing Fields. Failed to update team.',
    };
  }

  try {
    await updateTeam(id, name, description);
  } catch (error) {
    console.error('Database Error:', error);
    return {
      message: 'Database Error: Failed to update team.',
      errors: {},
    };
  }

  revalidatePath('/dashboard/admin/teams');
  redirect('/dashboard/admin/teams');
}

export async function deleteTeamAction(id: number) {
  await requireAdmin();

  try {
    await deleteTeam(id);
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to delete team.');
  }

  revalidatePath('/dashboard/admin/teams');
  redirect('/dashboard/admin/teams');
}
