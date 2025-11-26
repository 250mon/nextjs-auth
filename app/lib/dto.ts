import "server-only";
import { User } from "@/app/lib/definitions";
import { query } from "@/app/lib/db";

export async function getProfileDTO(slug: string) {
  try {
    const result = await query(`
      SELECT 
        users.id, 
        users.name, 
        users.email, 
        users.password, 
        users.slug, 
        users.isadmin
      FROM users
      WHERE users.slug = $1
    `, [slug]);
    
    const user = result.rows[0] as User;
    if (!user) {
      throw new Error('User not found');
    }
    
    return user;
  } catch (error) {
    console.error("Failed to fetch profile:", error);
    throw new Error("Failed to fetch profile");
  }
}
