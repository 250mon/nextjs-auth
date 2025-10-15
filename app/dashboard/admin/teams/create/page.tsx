import Form from '@/app/ui/admin/teams/create-form';
import Breadcrumbs from '@/app/ui/breadcrumbs';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create Team | Admin Dashboard',
};

export default async function CreateTeamPage() {
  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: 'Admin', href: '/dashboard/admin' },
          { label: 'Teams', href: '/dashboard/admin/teams' },
          {
            label: 'Create Team',
            href: '/dashboard/admin/teams/create',
            active: true,
          },
        ]}
      />
      <Form />
    </main>
  );
}
