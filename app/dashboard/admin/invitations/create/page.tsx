import { getCurrentUser } from "@/app/lib/dal";
import { notFound } from "next/navigation";
import Breadcrumbs from '@/app/ui/breadcrumbs';
import CreateInvitationForm from '@/app/ui/admin/invitations/create-form';
import { fetchCompanies } from '@/app/actions/admin/company-actions';
import type { Company } from '@/app/lib/definitions';

export default async function CreateInvitationPage() {
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
          { label: 'Invitations', href: '/dashboard/admin/invitations' },
          {
            label: 'Send Invitation',
            href: '/dashboard/admin/invitations/create',
            active: true,
          },
        ]}
      />
      <CreateInvitationForm 
        companies={companies} 
        isSuperAdmin={currentUser.is_super_admin}
      />
    </main>
  );
}

