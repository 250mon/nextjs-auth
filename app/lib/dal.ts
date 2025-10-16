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
      'SELECT * FROM users WHERE id = $1 AND active = true',
      [session.user.id as string]
    );
    
    const user = result.rows[0] as User;
    
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
    
    // Fetch user's teams with roles
    try {
      const teamsResult = await query(`
        SELECT t.id, t.name, t.description, t.created_at, t.updated_at, ut.role
        FROM teams t
        INNER JOIN user_teams ut ON t.id = ut.team_id
        WHERE ut.user_id = $1
        ORDER BY t.name ASC
      `, [user.id]);
      
      user.teams = teamsResult.rows;
    } catch (teamsError) {
      console.log("Failed to fetch user teams:", teamsError);
      // Don't fail the whole request if teams fail to load
      user.teams = [];
    }
    
    return user;
  } catch (error) {
    console.log("Failed to fetch user:", error);
    // Return null instead of throwing to gracefully handle DB issues
    return null;
  }
});
