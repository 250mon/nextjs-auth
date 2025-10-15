import { Metadata } from 'next';
import { CreateTeam } from '@/app/ui/admin/teams/buttons';
import TeamsTable from '@/app/ui/admin/teams/table';
import { lusitana } from '@/app/ui/fonts';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Teams | Admin Dashboard',
};

export default async function TeamsPage() {
  return (
    <div className="w-full">
      <div className="flex w-full items-center justify-between">
        <h1 className={`${lusitana.className} text-2xl`}>Teams</h1>
      </div>
      <div className="mt-4 flex items-center justify-between gap-2 md:mt-8">
        <div className="flex items-center space-x-2">
          <h2 className="text-lg font-medium text-gray-900">Manage Teams</h2>
        </div>
        <CreateTeam />
      </div>
      <Suspense fallback={<div>Loading...</div>}>
        <TeamsTable />
      </Suspense>
    </div>
  );
}
