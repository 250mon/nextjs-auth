import { getCurrentUser } from "@/app/lib/dal";
import { notFound } from "next/navigation";
import Breadcrumbs from '@/app/ui/breadcrumbs';
import CreateUserForm from '@/app/ui/admin/users/create-form';
import { fetchCompanies } from '@/app/actions/admin/company-actions';
import type { Company } from '@/app/lib/definitions';

export default async function CreateUserPage() {
  const currentUser = await getCurrentUser();
  
  // Only allow admins to access this page
  if (!currentUser?.isadmin) {
    notFound();
  }

  // Fetch companies if user is super admin
  let companies: Company[] = [];
  if (currentUser.is_super_admin) {
    try {
      companies = await fetchCompanies();
    } catch (error) {
      console.error('Failed to fetch companies:', error);
      // Continue without companies if fetch fails
    }
  }

  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: 'Admin', href: '/dashboard/admin' },
          { label: 'Users', href: '/dashboard/admin/users' },
          {
            label: 'Create User',
            href: '/dashboard/admin/users/create',
            active: true,
          },
        ]}
      />
      <CreateUserForm companies={companies} isSuperAdmin={currentUser.is_super_admin} />
    </main>
  );
}
