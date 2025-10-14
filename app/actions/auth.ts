"use server";

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { query } from "@/app/lib/db";
import { authConfig } from "@/auth.config";
import type { User } from "@/app/lib/definitions";
import { redirect } from "next/navigation";

// 1. Basic sign-in schema
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

// 2. Register schema: extend + refine
const registerSchema = signInSchema
  .extend({
    name: z
      .string({ error: "Name is required" })
      .min(3, "Name must be more than 3 characters")
      .max(100, "Name must be less than 100 characters"),
    confirm_password: z
      .string({ error: "Please confirm your password" })
      .min(6, "Password must be more than 6 characters")
      .max(32, "Password must be less than 32 characters"),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords must match",
    path: ["confirm_password"],
  });

export type FormState =
  | {
      errors?: {
        name?: string[];
        email?: string[];
        password?: string[];
        confirm_password?: string[];
      };
      message?: string;
    }
  | undefined;

async function getUser(email: string): Promise<User | undefined> {
  try {
    const result = await query("SELECT * FROM users WHERE email = $1", [email]);
    return result.rows[0] as User;
  } catch (error) {
    console.error("Failed to fetch user:", error);
    return undefined;
  }
}

export const { auth, signIn, signOut } = NextAuth({
  ...authConfig,
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

export async function customSignOut({
  redirectTo = "/",
}: { redirectTo?: string } = {}) {
  await signOut({ redirectTo });
}

export async function customSignIn(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    await signIn("credentials", formData);
  } catch (error) {
    // Handle authentication errors
    if (error && typeof error === 'object' && 'type' in error) {
      switch (error.type) {
        case "CredentialsSignIn":
          return "Invalid email or password";
        default:
          return "Something went wrong, Please try again.";
      }
    }
    throw error;
  }
}

export async function signUp(state: FormState, formData: FormData) {
  try {
    // 1. Validate form fields
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const confirm_password = formData.get("confirm_password") as string;
    const redirectTo = formData.get("redirectTo") as string;

    const parsedCredentials = registerSchema.safeParse({
      name,
      email,
      password,
      confirm_password,
    });

    // If any form fields are invalid, return early
    if (!parsedCredentials.success) {
      return {
        errors: parsedCredentials.error.flatten().fieldErrors,
      };
    }

    // 2. Prepare data for insertion into database
    const hashedPassword = await bcrypt.hash(
      parsedCredentials.data.password,
      10,
    );

    // 3. Insert the user into the database
    try {
      // Generate a unique slug by combining name and a unique identifier
      const baseSlug = parsedCredentials.data.name
        .toLowerCase()
        .replace(/\s+/g, "-");
      const uniqueId = Math.random().toString(36).substring(2, 8); // 6 random characters
      const slug = `${baseSlug}-${uniqueId}`;

      // Insert user
      const userResult = await query(
        `INSERT INTO users (name, email, password, slug, isadmin, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
         RETURNING id`,
        [
          parsedCredentials.data.name,
          parsedCredentials.data.email,
          hashedPassword,
          slug,
          false,
        ],
      );

      const newUserId = userResult.rows[0].id;

      // Add user to a default team if it exists
      try {
        const defaultTeamResult = await query(
          "SELECT id FROM teams WHERE name = $1",
          ["DefaultTeam"],
        );
        if (defaultTeamResult.rows.length > 0) {
          await query(
            "INSERT INTO user_teams (user_id, team_id, role, created_at) VALUES ($1, $2, $3, NOW())",
            [newUserId, defaultTeamResult.rows[0].id, "member"],
          );
        }
      } catch (teamError) {
        console.log("Could not add user to default team:", teamError);
        // Don't fail registration if team assignment fails
      }

      const result = await query("SELECT * FROM users WHERE email = $1", [
        parsedCredentials.data.email,
      ]);

      if (!result.rows[0]) {
        throw new Error("Failed to retrieve user after insertion");
      }
    } catch (error) {
      console.error("Database error:", error);
      throw error;
    }

    // 4. User created successfully, NextAuth will handle session
    // 5. Redirect user
    redirect(redirectTo);
  } catch (error) {
    // Ignore NEXT_REDIRECT errors as they are expected
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error;
    }

    console.error("Signup error:", error);
    return {
      message: `Failed to create account. ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}
