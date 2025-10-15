import { getCurrentUser } from "@/app/lib/dal";
import { notFound } from "next/navigation";
import Breadcrumbs from '@/app/ui/breadcrumbs';
import CreateUserForm from '@/app/ui/admin/users/create-form';

export default async function CreateUserPage() {
  const currentUser = await getCurrentUser();
  
  // Only allow admins to access this page
  if (!currentUser?.isadmin) {
    notFound();
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
      <CreateUserForm />
    </main>
  );
}
