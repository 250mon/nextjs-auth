import { getCurrentUser } from "@/app/lib/dal";
import { notFound } from "next/navigation";
import Breadcrumbs from '@/app/ui/breadcrumbs';
import CreateCompanyForm from '@/app/ui/admin/companies/create-form';

export default async function CreateCompanyPage() {
  const currentUser = await getCurrentUser();
  
  // Only allow super admins to access this page
  if (!currentUser?.is_super_admin) {
    notFound();
  }

  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: 'Admin', href: '/dashboard/admin' },
          { label: 'Companies', href: '/dashboard/admin/companies' },
          {
            label: 'Create Company',
            href: '/dashboard/admin/companies/create',
            active: true,
          },
        ]}
      />
      <CreateCompanyForm />
    </main>
  );
}

