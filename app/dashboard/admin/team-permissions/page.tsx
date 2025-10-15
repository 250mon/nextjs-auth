import { getCurrentUser } from "@/app/lib/dal";
import { notFound } from "next/navigation";
import { lusitana } from "@/app/ui/fonts";
import { TeamPermissionsManager } from "@/app/ui/admin/team-permissions/team-permissions-manager";

export default async function TeamPermissionsPage() {
  const currentUser = await getCurrentUser();
  
  // Only allow admins to access this page
  if (!currentUser?.isadmin) {
    notFound();
  }

  return (
    <div className="w-full">
      <div className="flex w-full items-center justify-between mb-6">
        <h1 className={`${lusitana.className} text-2xl`}>Team Permissions Management</h1>
      </div>
      
      <div className="mb-6">
        <p className="text-gray-600">
          Manage team permissions for different resources and pages. Changes take effect immediately.
        </p>
      </div>

      <TeamPermissionsManager />
    </div>
  );
}
