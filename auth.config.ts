import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { query } from "@/app/lib/db";
import type { User } from "@/app/lib/definitions";
import { basePath } from "@/app/lib/utils";

// Basic sign-in schema
const signInSchema = z.object({
  email: z
    .string({ error: "Email is required" })
    .min(1, "Email required")
    .email("Invalid email"),
  password: z
    .string({ error: "Password is required " })
    .min(6, "Password must be more than 6 characters")
    .max(32, "Password must be less than 32 characters"),
});

async function getUser(email: string): Promise<User | undefined> {
  try {
    const result = await query("SELECT * FROM users WHERE email = $1", [email]);
    return result.rows[0] as User;
  } catch (error) {
    console.error("Failed to fetch user:", error);
    return undefined;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  pages: {
    signIn: "/login",
  },
  callbacks: {
    // Ensure user ID is passed from JWT to session
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (token.id && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
    redirect({ url, baseUrl }) {
      // Handle redirects with basePath
      // If url is relative (starts with /), construct absolute URL with basePath
      if (url.startsWith('/')) {
        const baseUrlObj = new URL(baseUrl);
        // Check if baseUrl already includes basePath
        const baseUrlHasBasePath = basePath && baseUrlObj.pathname.startsWith(basePath);
        
        if (basePath && !baseUrlHasBasePath) {
          // baseUrl doesn't include basePath, so we need to add it
          return `${baseUrl}${basePath}${url}`;
        }
        // baseUrl already includes basePath or no basePath configured
        return `${baseUrl}${url}`;
      }
      // If url is absolute and same origin, check if it needs basePath
      try {
        const urlObj = new URL(url);
        const baseUrlObj = new URL(baseUrl);
        if (urlObj.origin === baseUrlObj.origin) {
          // Same origin - check if basePath needs to be added
          if (basePath && !urlObj.pathname.startsWith(basePath)) {
            // URL doesn't have basePath, add it
            urlObj.pathname = `${basePath}${urlObj.pathname}`;
            return urlObj.toString();
          }
          return url;
        }
      } catch {
        // Invalid URL, fall through to default
      }
      // Default to baseUrl with basePath if needed
      if (basePath) {
        const baseUrlObj = new URL(baseUrl);
        if (!baseUrlObj.pathname.startsWith(basePath)) {
          baseUrlObj.pathname = `${basePath}${baseUrlObj.pathname}`;
          return baseUrlObj.toString();
        }
      }
      return baseUrl;
    },
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const parsedCredentials = signInSchema.safeParse(credentials);

        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data;
          const user = await getUser(email);
          if (!user) return null;
          const passwordMatch = await bcrypt.compare(password, user.password);

          if (passwordMatch) {
            return user;
          }
        }

        return null;
      },
    }),
  ],
});
