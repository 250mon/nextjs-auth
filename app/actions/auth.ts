"use server";

import { z } from "zod";
import { adaptZodError } from "@/app/lib/zod-error-adaptor";
import bcrypt from "bcryptjs";
import { query } from "@/app/lib/db";
import { signIn, signOut } from "@/auth.config";
import { redirect } from "next/navigation";

// Register schema: extend + refine
const registerSchema = z
  .object({
    email: z
      .string({ error: "Email is required" })
      .min(1, "Email required")
      .email("Invalid email"),
    password: z
      .string({ error: "Password is required " })
      .min(6, "Password must be more than 6 characters")
      .max(32, "Password must be less than 32 characters"),
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
      const adapted = adaptZodError(parsedCredentials.error);
      return {
        errors: {
          name: adapted.fieldErrors["name"] ? [adapted.fieldErrors["name"]] : undefined,
          email: adapted.fieldErrors["email"] ? [adapted.fieldErrors["email"]] : undefined,
          password: adapted.fieldErrors["password"] ? [adapted.fieldErrors["password"]] : undefined,
          confirm_password: adapted.fieldErrors["confirm_password"] ? [adapted.fieldErrors["confirm_password"]] : undefined,
        },
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
      await query(
        `INSERT INTO users (name, email, password, slug, isadmin, active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
        [
          parsedCredentials.data.name,
          parsedCredentials.data.email,
          hashedPassword,
          slug,
          false,
          true,
        ],
      );

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
