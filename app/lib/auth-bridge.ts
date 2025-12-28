/**
 * Bridge between NextAuth and Custom API Service
 * This allows sharing authentication state between both systems
 */

import { auth } from "@/auth.config";
import { generateApiToken } from "./jwt-service";
import { query } from "./db";

/**
 * Get API token for current NextAuth session
 * Useful when web app needs to make API calls
 */
export async function getApiTokenFromSession(): Promise<string | null> {
  try {
    const session = await auth();
    
    if (!session?.user?.id || !session.user.email || !session.user.name) {
      return null;
    }

    // Fetch full user data from database to get is_super_admin and company_id
    const userResult = await query(
      "SELECT id, email, name, isadmin, is_super_admin, company_id FROM users WHERE id = $1",
      [session.user.id]
    );

    if (userResult.rows.length === 0) {
      return null;
    }

    const user = userResult.rows[0] as { id: string; email: string; name: string; isadmin: boolean; is_super_admin: boolean; company_id: string | null };

    // Generate API token from user data
    const apiToken = await generateApiToken({
      id: user.id,
      email: user.email,
      name: user.name,
      isadmin: user.isadmin,
      is_super_admin: user.is_super_admin,
      company_id: user.company_id,
    });

    return apiToken;
  } catch (error) {
    console.error("Failed to generate API token from session:", error);
    return null;
  }
}

/**
 * Validate API token and return user info
 * Useful for API endpoints that need to work with NextAuth
 */
export async function validateApiTokenForNextAuth(token: string) {
  try {
    const { verifyApiToken } = await import("./jwt-service");
    const payload = await verifyApiToken(token);
    
    if (!payload) {
      return null;
    }

    // Return in NextAuth user format
    return {
      id: payload.id,
      email: payload.email,
      name: payload.name,
      isadmin: payload.isadmin,
    };
  } catch (error) {
    console.error("Failed to validate API token:", error);
    return null;
  }
}
