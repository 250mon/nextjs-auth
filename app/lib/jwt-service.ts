import jwt from "jsonwebtoken";

// JWT secret - in production, this should be in environment variables
const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-change-this-in-production";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "your-super-secret-refresh-key-change-this-in-production";

export interface TokenPayload {
  id: string;
  email: string;
  name: string;
  isadmin: boolean;
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  id: string;
  email: string;
  iat?: number;
  exp?: number;
}

/**
 * Generate an API access token
 */
export async function generateApiToken(payload: Omit<TokenPayload, 'iat' | 'exp'>): Promise<string> {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: "1h", // 1 hour
    issuer: "nextjs-auth-api",
    audience: "api-clients",
  });
}

/**
 * Generate a refresh token
 */
export async function generateRefreshToken(payload: Omit<RefreshTokenPayload, 'iat' | 'exp'>): Promise<string> {
  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: "7d", // 7 days
    issuer: "nextjs-auth-api",
    audience: "api-clients",
  });
}

/**
 * Verify an API access token
 */
export async function verifyApiToken(token: string): Promise<TokenPayload | null> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: "nextjs-auth-api",
      audience: "api-clients",
    }) as TokenPayload;
    
    return decoded;
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
}

/**
 * Verify a refresh token
 */
export async function verifyRefreshToken(token: string): Promise<RefreshTokenPayload | null> {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET, {
      issuer: "nextjs-auth-api",
      audience: "api-clients",
    }) as RefreshTokenPayload;
    
    return decoded;
  } catch (error) {
    console.error("Refresh token verification failed:", error);
    return null;
  }
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.substring(7);
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token: string): boolean {
  try {
    const decoded = jwt.decode(token) as { exp?: number } | null;
    if (!decoded || !decoded.exp) {
      return true;
    }
    return Date.now() >= decoded.exp * 1000;
  } catch {
    return true;
  }
}
