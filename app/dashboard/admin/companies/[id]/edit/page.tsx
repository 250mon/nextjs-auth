import { getCurrentUser } from "@/app/lib/dal";
import { fetchCompanyById } from "@/app/actions/admin/company-actions";
import { notFound } from "next/navigation";
import Breadcrumbs from '@/app/ui/breadcrumbs';
import EditCompanyForm from '@/app/ui/admin/companies/edit-form';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCompanyPage({ params }: PageProps) {
  const { id } = await params;
  const currentUser = await getCurrentUser();
  
  // Only allow super admins to access this page
  if (!currentUser?.is_super_admin) {
    notFound();
  }

  const company = await fetchCompanyById(id);
  
  if (!company) {
    notFound();
  }

  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: 'Admin', href: '/dashboard/admin' },
          { label: 'Companies', href: '/dashboard/admin/companies' },
          {
            label: 'Edit Company',
            href: `/dashboard/admin/companies/${id}/edit`,
            active: true,
          },
        ]}
      />
      <EditCompanyForm company={company} />
    </main>
  );
}

