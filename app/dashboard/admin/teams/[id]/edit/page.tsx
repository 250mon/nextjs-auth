import Form from '@/app/ui/admin/teams/edit-form';
import Breadcrumbs from '@/app/ui/breadcrumbs';
import { fetchTeamById } from '@/app/actions/team-actions';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Edit Team | Admin Dashboard',
};

export default async function EditTeamPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const teamId = parseInt(id);
  
  if (isNaN(teamId)) {
    notFound();
  }

  const team = await fetchTeamById(teamId);

  if (!team) {
    notFound();
  }

  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: 'Admin', href: '/dashboard/admin' },
          { label: 'Teams', href: '/dashboard/admin/teams' },
          {
            label: 'Edit Team',
            href: `/dashboard/admin/teams/${id}/edit`,
            active: true,
          },
        ]}
      />
      <Form team={team} />
    </main>
  );
}
