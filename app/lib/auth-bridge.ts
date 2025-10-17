/**
 * Bridge between NextAuth and Custom API Service
 * This allows sharing authentication state between both systems
 */

import { auth } from "@/auth.config";
import { generateApiToken } from "./jwt-service";

/**
 * Get API token for current NextAuth session
 * Useful when web app needs to make API calls
 */
export async function getApiTokenFromSession(): Promise<string | null> {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return null;
    }

    // Generate API token from NextAuth session
    const apiToken = await generateApiToken({
      id: session.user.id,
      email: session.user.email!,
      name: session.user.name!,
      isadmin: false, // You might want to add this to your NextAuth session
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
