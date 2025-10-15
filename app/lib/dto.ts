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
        COALESCE(
          json_agg(
            json_build_object(
              'id', teams.id,
              'name', teams.name,
              'description', teams.description
            )
          ) FILTER (WHERE teams.id IS NOT NULL),
          '[]'::json
        ) as teams
      FROM users
      LEFT JOIN user_teams ON users.id = user_teams.user_id
      LEFT JOIN teams ON user_teams.team_id = teams.id
      WHERE users.slug = $1
      GROUP BY users.id, users.name, users.email, users.password, users.slug, users.isadmin
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
