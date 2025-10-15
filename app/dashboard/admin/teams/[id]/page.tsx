import { fetchTeamById, fetchTeamUsers } from '@/app/actions/team-actions';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { lusitana } from '@/app/ui/fonts';
import { UpdateTeam } from '@/app/ui/admin/teams/buttons';
import { formatDateToLocal } from '@/app/lib/utils';
import { UsersIcon, CalendarIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Team Details | Admin Dashboard',
};

export default async function TeamDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const teamId = parseInt(id);
  
  if (isNaN(teamId)) {
    notFound();
  }

  const [team, members] = await Promise.all([
    fetchTeamById(teamId),
    fetchTeamUsers(teamId)
  ]);

  if (!team) {
    notFound();
  }

  return (
    <div className="w-full">
      <div className="flex w-full items-center justify-between">
        <h1 className={`${lusitana.className} text-2xl`}>Team: {team.name}</h1>
        <UpdateTeam id={team.id} />
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        {/* Team Information */}
        <div className="rounded-lg bg-white p-6 shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <PencilSquareIcon className="w-5 h-5 mr-2" />
            Team Information
          </h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Name</p>
              <p className="text-gray-900">{team.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Description</p>
              <p className="text-gray-900">{team.description || 'No description provided'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Created</p>
              <p className="text-gray-900 flex items-center">
                <CalendarIcon className="w-4 h-4 mr-1" />
                {formatDateToLocal(team.created_at.toString())}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Last Updated</p>
              <p className="text-gray-900 flex items-center">
                <CalendarIcon className="w-4 h-4 mr-1" />
                {formatDateToLocal(team.updated_at.toString())}
              </p>
            </div>
          </div>
        </div>

        {/* Team Members */}
        <div className="rounded-lg bg-white p-6 shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <UsersIcon className="w-5 h-5 mr-2" />
            Team Members ({members.length})
          </h2>
          
          {members.length === 0 ? (
            <div className="text-center py-8">
              <UsersIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No members in this team yet</p>
              <Link
                href="/dashboard/admin/users"
                className="inline-flex items-center mt-2 text-sm text-blue-600 hover:text-blue-800"
              >
                Add members through user management
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {members.map((member: { id: string; name: string; email: string; role?: string }) => (
                <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">
                        {member.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{member.name}</p>
                      <p className="text-sm text-gray-500">{member.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                      {member.role || 'member'}
                    </span>
                    <Link
                      href={`/dashboard/admin/users/${member.id}/edit`}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
