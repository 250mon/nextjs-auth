import { getCurrentUser } from "@/app/lib/dal";
import { fetchUserById } from "@/app/actions/admin/user-actions";
import { notFound } from "next/navigation";
import Breadcrumbs from '@/app/ui/breadcrumbs';
import EditUserForm from '@/app/ui/admin/users/edit-form';
import { fetchCompanies } from '@/app/actions/admin/company-actions';
import type { Company } from '@/app/lib/definitions';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditUserPage({ params }: PageProps) {
  const { id } = await params;
  const currentUser = await getCurrentUser();
  
  // Only allow admins to access this page
  if (!currentUser?.isadmin) {
    notFound();
  }

  const user = await fetchUserById(id);
  
  if (!user) {
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
            label: 'Edit User',
            href: `/dashboard/admin/users/${id}/edit`,
            active: true,
          },
        ]}
      />
      <EditUserForm user={user} companies={companies} isSuperAdmin={currentUser.is_super_admin} />
    </main>
  );
}
