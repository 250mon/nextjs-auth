import { redirect } from "next/navigation";
import { getCurrentUser } from "@/app/lib/dal";

export default async function ProfileRedirectPage() {
  const currentUser = await getCurrentUser();
  
  if (!currentUser) {
    redirect("/login");
  }
  
  // Redirect to the current user's profile page using their slug
  redirect(`/dashboard/profile/${currentUser.slug}`);
}
