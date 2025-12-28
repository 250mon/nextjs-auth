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
        users.isadmin,
        users.is_super_admin,
        users.company_id,
        companies.name as company_name
      FROM users
      LEFT JOIN companies ON users.company_id = companies.id
      WHERE users.slug = $1
    `, [slug]);
    
    const user = result.rows[0] as User & { company_name?: string };
    if (!user) {
      throw new Error('User not found');
    }
    
    return user;
  } catch (error) {
    console.error("Failed to fetch profile:", error);
    throw new Error("Failed to fetch profile");
  }
}
