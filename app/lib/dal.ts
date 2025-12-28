import "server-only";

import { cache } from "react";
import { auth } from "@/auth.config";
import { query } from "@/app/lib/db";
import type { User } from "@/app/lib/definitions";

export const verifySession = cache(async () => {
  const session = await auth();
  
  if (!session?.user?.id) {
    return { isAuth: false, userId: null };
  }

  return { isAuth: true, userId: session.user.id };
});

export const getCurrentUser = cache(async () => {
  const session = await auth();
  if (!session?.user?.id) return null;

  try {
    const result = await query(
      `SELECT u.*, c.name as company_name 
       FROM users u 
       LEFT JOIN companies c ON u.company_id = c.id 
       WHERE u.id = $1 AND u.active = true`,
      [session.user.id as string]
    );
    
    const user = result.rows[0] as User & { company_name?: string };
    
    // If user not found or inactive, they should be logged out
    if (!user) {
      console.log("User not found or inactive, should be logged out:", session.user.id);
      // In a real app, you might want to clear the session here
      // For now, we'll return null which will hide navigation
      return null;
    }
    
    // Validate user has required fields
    if (!user.email || !user.name || !user.slug) {
      console.log("User missing required fields:", {
        id: user.id,
        hasEmail: !!user.email,
        hasName: !!user.name,
        hasSlug: !!user.slug
      });
      return null;
    }
    
    return user;
  } catch (error) {
    console.log("Failed to fetch user:", error);
    // Return null instead of throwing to gracefully handle DB issues
    return null;
  }
});
