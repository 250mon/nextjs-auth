"use server";

import { z } from "zod";
import { adaptZodError } from "@/app/lib/zod-error-adaptor";
import bcrypt from "bcryptjs";
import { query } from "@/app/lib/db";
import { getCurrentUser } from "@/app/lib/dal";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// Profile update schema
const updateProfileSchema = z.object({
  name: z
    .string({ error: "Name is required" })
    .min(3, "Name must be more than 3 characters")
    .max(100, "Name must be less than 100 characters"),
  isadmin: z.boolean(),
});

// Password change schema
const changePasswordSchema = z.object({
  currentPassword: z
    .string({ error: "Current password is required" })
    .min(1, "Current password is required"),
  newPassword: z
    .string({ error: "New password is required" })
    .min(6, "Password must be more than 6 characters")
    .max(32, "Password must be less than 32 characters"),
  confirmPassword: z
    .string({ error: "Please confirm your password" })
    .min(6, "Password must be more than 6 characters")
    .max(32, "Password must be less than 32 characters"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "New passwords must match",
  path: ["confirmPassword"],
});

export type ProfileUpdateState = {
  errors?: {
    name?: string[];
    isadmin?: string[];
    general?: string[];
  };
  message?: string | null;
};

export type PasswordChangeState = {
  errors?: {
    currentPassword?: string[];
    newPassword?: string[];
    confirmPassword?: string[];
    general?: string[];
  };
  message?: string | null;
};

// Helper to get current user ID
async function getCurrentUserId() {
  const user = await getCurrentUser();
  
  if (!user) {
    throw new Error("Not authenticated");
  }
  
  return user.id;
}

// Update profile information
export async function updateProfile(formData: FormData) {
  try {
    const userId = await getCurrentUserId();
    
    // Extract form data
    const name = formData.get('name') as string;
    const isadmin = formData.get('isadmin') === 'true';

    // Validate form data
    const validatedFields = updateProfileSchema.safeParse({
      name,
      isadmin,
    });

    if (!validatedFields.success) {
      const adapted = adaptZodError(validatedFields.error);
      return {
        errors: {
          name: adapted.fieldErrors["name"] ? [adapted.fieldErrors["name"]] : undefined,
          isadmin: adapted.fieldErrors["isadmin"] ? [adapted.fieldErrors["isadmin"]] : undefined,
          general: adapted.formErrors,
        },
        message: 'Missing Fields. Failed to update profile.',
      };
    }

    const { name: validName, isadmin: validIsAdmin } = validatedFields.data;

    // Update user in database
    await query(
      `UPDATE users 
       SET name = $1, isadmin = $2, updated_at = NOW()
       WHERE id = $3`,
      [validName, validIsAdmin, userId]
    );

    // Revalidate the profile page
    revalidatePath('/profile');
    
    return {
      message: 'Profile updated successfully.',
    };

  } catch (error) {
    console.error('Profile update error:', error);
    return {
      errors: {
        general: ['Failed to update profile. Please try again.'],
      },
      message: 'Database Error: Failed to update profile.',
    };
  }
}

// Change password
export async function changePassword(
  prevState: PasswordChangeState,
  formData: FormData,
): Promise<PasswordChangeState> {
  try {
    const userId = await getCurrentUserId();
    
    // Extract form data
    const currentPassword = formData.get('currentPassword') as string;
    const newPassword = formData.get('newPassword') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    // Validate form data
    const validatedFields = changePasswordSchema.safeParse({
      currentPassword,
      newPassword,
      confirmPassword,
    });

    if (!validatedFields.success) {
      const adapted = adaptZodError(validatedFields.error);
      return {
        errors: {
          currentPassword: adapted.fieldErrors["currentPassword"] ? [adapted.fieldErrors["currentPassword"]] : undefined,
          newPassword: adapted.fieldErrors["newPassword"] ? [adapted.fieldErrors["newPassword"]] : undefined,
          confirmPassword: adapted.fieldErrors["confirmPassword"] ? [adapted.fieldErrors["confirmPassword"]] : undefined,
          general: adapted.formErrors,
        },
        message: 'Missing Fields. Failed to change password.',
      };
    }

    // Get current user from database
    const userResult = await query(
      'SELECT password FROM users WHERE id = $1',
      [userId]
    );

    if (!userResult.rows[0]) {
      return {
        errors: {
          general: ['User not found.'],
        },
        message: 'Failed to change password.',
      };
    }

    // Verify current password
    const currentPasswordMatch = await bcrypt.compare(
      validatedFields.data.currentPassword,
      userResult.rows[0].password
    );

    if (!currentPasswordMatch) {
      return {
        errors: {
          currentPassword: ['Current password is incorrect.'],
        },
        message: 'Current password is incorrect.',
      };
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(validatedFields.data.newPassword, 10);

    // Update password in database
    await query(
      `UPDATE users 
       SET password = $1, updated_at = NOW()
       WHERE id = $2`,
      [hashedNewPassword, userId]
    );

    return {
      message: 'Password changed successfully.',
    };

  } catch (error) {
    console.error('Password change error:', error);
    return {
      errors: {
        general: ['Failed to change password. Please try again.'],
      },
      message: 'Database Error: Failed to change password.',
    };
  }
}

// Get current user's profile for editing
export async function getCurrentUserProfile() {
  const user = await getCurrentUser();
  
  if (!user) {
    throw new Error('Not authenticated');
  }

  return user;
}

// Server action for profile update (with redirect)
export async function updateProfileServer(formData: FormData) {
  try {
    const userId = await getCurrentUserId();
    
    // Extract form data
    const name = formData.get('name') as string;
    const isadmin = formData.get('isadmin') === 'true';

    // Validate form data
    const validatedFields = updateProfileSchema.safeParse({
      name,
      isadmin,
    });

    if (!validatedFields.success) {
      throw new Error('Invalid form data');
    }

    const { name: validName, isadmin: validIsAdmin } = validatedFields.data;

    // Get user slug for redirect
    const userResult = await query('SELECT slug FROM users WHERE id = $1', [userId]);
    const userSlug = userResult.rows[0]?.slug;

    if (!userSlug) {
      throw new Error('User not found');
    }

    // Update user in database
    await query(
      `UPDATE users 
       SET name = $1, isadmin = $2, updated_at = NOW()
       WHERE id = $3`,
      [validName, validIsAdmin, userId]
    );

    // Revalidate the profile page
    revalidatePath(`/profile/${userSlug}`);
    revalidatePath('/dashboard');
    
    // Redirect to profile page with success message
    redirect(`/profile/${userSlug}?updated=profile`);

  } catch (error) {
    console.error('Profile update error:', error);
    throw new Error('Failed to update profile');
  }
}

// Server action for password change (with redirect)
export async function changePasswordServer(formData: FormData) {
  try {
    const userId = await getCurrentUserId();
    
    // Extract form data
    const currentPassword = formData.get('currentPassword') as string;
    const newPassword = formData.get('newPassword') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    // Validate form data
    const validatedFields = changePasswordSchema.safeParse({
      currentPassword,
      newPassword,
      confirmPassword,
    });

    if (!validatedFields.success) {
      throw new Error('Invalid password data');
    }

    // Get current user from database
    const userResult = await query(
      'SELECT password, slug FROM users WHERE id = $1',
      [userId]
    );

    if (!userResult.rows[0]) {
      throw new Error('User not found');
    }

    const { password: currentHashedPassword, slug: userSlug } = userResult.rows[0];

    // Verify current password
    const currentPasswordMatch = await bcrypt.compare(
      validatedFields.data.currentPassword,
      currentHashedPassword
    );

    if (!currentPasswordMatch) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(validatedFields.data.newPassword, 10);

    // Update password in database
    await query(
      `UPDATE users 
       SET password = $1, updated_at = NOW()
       WHERE id = $2`,
      [hashedNewPassword, userId]
    );

    // Revalidate the profile page
    revalidatePath(`/profile/${userSlug}`);
    
    // Redirect to profile page with success message
    redirect(`/profile/${userSlug}?updated=password`);

  } catch (error) {
    console.error('Password change error:', error);
    throw new Error('Failed to change password');
  }
}
