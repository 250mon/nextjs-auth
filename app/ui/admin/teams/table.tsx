import { formatDateToLocal } from '@/app/lib/utils';
import { fetchAllTeams, fetchTeamUsers } from '@/app/actions/team-actions';
import { UpdateTeam, DeleteTeam, ViewTeam } from './buttons';
import { UsersIcon, CalendarIcon } from '@heroicons/react/24/outline';

export default async function TeamsTable() {
  const teams = await fetchAllTeams();

  // Get member counts for each team
  const teamsWithCounts = await Promise.all(
    teams.map(async (team) => {
      const members = await fetchTeamUsers(team.id);
      return {
        ...team,
        memberCount: members.length,
      };
    })
  );

  return (
    <div className="mt-6 flow-root">
      <div className="inline-block min-w-full align-middle">
        <div className="rounded-lg bg-gray-50 p-2 md:pt-0">
          {/* Mobile view */}
          <div className="md:hidden">
            {teamsWithCounts?.map((team) => (
              <div
                key={team.id}
                className="mb-2 w-full rounded-md bg-white p-4"
              >
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <div className="mb-2 flex items-center">
                      <p className="text-sm font-medium">{team.name}</p>
                    </div>
                    <p className="text-sm text-gray-500">
                      {team.description || 'No description'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <UsersIcon className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{team.memberCount}</span>
                  </div>
                </div>
                <div className="flex w-full items-center justify-between pt-4">
                  <div>
                    <p className="text-sm text-gray-500 flex items-center">
                      <CalendarIcon className="w-4 h-4 mr-1" />
                      Created: {formatDateToLocal(team.created_at.toString())}
                    </p>
                  </div>
                  <div className="flex justify-end gap-2">
                    <ViewTeam id={team.id} />
                    <UpdateTeam id={team.id} />
                    <DeleteTeam id={team.id} name={team.name} memberCount={team.memberCount} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop view */}
          <table className="hidden min-w-full text-gray-900 md:table">
            <thead className="rounded-lg text-left text-sm font-normal">
              <tr>
                <th scope="col" className="px-4 py-5 font-medium sm:pl-6">
                  Team Name
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  Description
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  Members
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  Created
                </th>
                <th scope="col" className="relative py-3 pl-6 pr-3">
                  <span className="sr-only">Edit</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {teamsWithCounts?.map((team) => (
                <tr
                  key={team.id}
                  className="w-full border-b py-3 text-sm last-of-type:border-none [&:first-child>td:first-child]:rounded-tl-lg [&:first-child>td:last-child]:rounded-tr-lg [&:last-child>td:first-child]:rounded-bl-lg [&:last-child>td:last-child]:rounded-br-lg"
                >
                  <td className="whitespace-nowrap py-3 pl-6 pr-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">
                          {team.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <p className="font-medium">{team.name}</p>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 max-w-xs">
                    <p className="truncate text-gray-600">
                      {team.description || 'No description'}
                    </p>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    <div className="flex items-center space-x-2">
                      <UsersIcon className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{team.memberCount}</span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    {formatDateToLocal(team.created_at.toString())}
                  </td>
                  <td className="whitespace-nowrap py-3 pl-6 pr-3">
                    <div className="flex justify-end gap-3">
                      <ViewTeam id={team.id} />
                      <UpdateTeam id={team.id} />
                      <DeleteTeam id={team.id} name={team.name} memberCount={team.memberCount} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
