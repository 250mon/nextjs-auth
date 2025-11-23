'use client';

import Link from 'next/link';
import { Button } from '@/app/ui/button';
import { updateUser, changeUserPassword, UserState } from '@/app/actions/admin-actions';
import { useActionState, useEffect, useState } from 'react';
import { User, Team } from '@/app/lib/definitions';
import { UserIcon, EnvelopeIcon, KeyIcon } from '@heroicons/react/24/outline';
import { fetchAllTeams } from '@/app/actions/team-actions';

export default function EditUserForm({ user }: { user: User }) {
  const initialState: UserState = { message: '', errors: {} };
  const updateUserWithId = updateUser.bind(null, user.id);
  const changePasswordWithId = changeUserPassword.bind(null, user.id);
  
  const [updateState, updateFormAction] = useActionState<UserState, FormData>(updateUserWithId, initialState);
  const [passwordState, passwordFormAction] = useActionState<UserState, FormData>(changePasswordWithId, initialState);
  
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<number[]>(user.teams?.map(t => t.id) || []);

  useEffect(() => {
    const loadTeams = async () => {
      try {
        const allTeams = await fetchAllTeams();
        setTeams(allTeams);
      } catch (error) {
        console.error('Failed to load teams:', error);
      }
    };
    loadTeams();
  }, []);

  const handleTeamChange = (teamId: number, checked: boolean) => {
    if (checked) {
      setSelectedTeams(prev => [...prev, teamId]);
    } else {
      setSelectedTeams(prev => prev.filter(id => id !== teamId));
    }
  };

  return (
    <div className="space-y-8">
      {/* User Information Form */}
      <div className="rounded-lg bg-gray-50 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">User Information</h3>
        <form action={updateFormAction}>
          <div className="grid gap-6 mb-6 md:grid-cols-2">
            {/* Name */}
            <div>
              <label htmlFor="name" className="mb-2 block text-sm font-medium">
                Full Name
              </label>
              <div className="relative">
                <input
                  id="name"
                  name="name"
                  type="text"
                  defaultValue={user.name}
                  placeholder="Enter full name"
                  className="peer block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
                  aria-describedby="name-error"
                  required
                />
                <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
              </div>
              <div id="name-error" aria-live="polite" aria-atomic="true">
                {updateState.errors?.name &&
                  updateState.errors.name.map((error: string) => (
                    <p className="mt-2 text-sm text-red-500" key={error}>
                      {error}
                    </p>
                  ))}
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium">
                Email Address
              </label>
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={user.email}
                  placeholder="Enter email address"
                  className="peer block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
                  aria-describedby="email-error"
                  required
                />
                <EnvelopeIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
              </div>
              <div id="email-error" aria-live="polite" aria-atomic="true">
                {updateState.errors?.email &&
                  updateState.errors.email.map((error: string) => (
                    <p className="mt-2 text-sm text-red-500" key={error}>
                      {error}
                    </p>
                  ))}
              </div>
            </div>

            {/* Teams */}
            <div className="col-span-2">
              <label className="mb-2 block text-sm font-medium">
                Teams
              </label>
              <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-md p-3">
                {teams.length > 0 ? (
                  teams.map((team) => (
                    <div key={team.id} className="flex items-center">
                      <input
                        id={`team-${team.id}`}
                        name="teams"
                        type="checkbox"
                        value={team.id}
                        checked={selectedTeams.includes(team.id)}
                        onChange={(e) => handleTeamChange(team.id, e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 bg-gray-100 text-blue-600 focus:ring-2 focus:ring-blue-500"
                      />
                      <label htmlFor={`team-${team.id}`} className="ml-2 text-sm">
                        <span className="font-medium text-gray-900">{team.name}</span>
                        {team.description && (
                          <span className="text-gray-500"> - {team.description}</span>
                        )}
                      </label>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No teams available</p>
                )}
              </div>
              {/* Hidden inputs for selected teams */}
              {selectedTeams.map(teamId => (
                <input key={teamId} type="hidden" name="selectedTeams" value={teamId} />
              ))}
            </div>

            {/* Status Checkboxes */}
            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  id="active"
                  name="active"
                  type="checkbox"
                  defaultChecked={user.active}
                  value="true"
                  className="h-4 w-4 rounded border-gray-300 bg-gray-100 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="active" className="ml-2 text-sm font-medium text-gray-900">
                  Active User
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  id="isadmin"
                  name="isadmin"
                  type="checkbox"
                  defaultChecked={user.isadmin}
                  value="true"
                  className="h-4 w-4 rounded border-gray-300 bg-gray-100 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="isadmin" className="ml-2 text-sm font-medium text-gray-900">
                  Administrator Privileges
                </label>
              </div>
            </div>
          </div>

          <div aria-live="polite" aria-atomic="true">
            {updateState.message ? (
              <p className="mt-2 text-sm text-red-500">{updateState.message}</p>
            ) : null}
          </div>

          <div className="flex justify-end gap-4">
            <Link
              href="/dashboard/admin/users"
              className="flex h-10 items-center rounded-lg bg-gray-100 px-4 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200"
            >
              Cancel
            </Link>
            <Button type="submit">Update User</Button>
          </div>
        </form>
      </div>

      {/* Change Password Form */}
      <div className="rounded-lg bg-gray-50 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h3>
        <form action={passwordFormAction}>
          <div className="mb-6">
            <label htmlFor="newPassword" className="mb-2 block text-sm font-medium">
              New Password
            </label>
            <div className="relative">
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                placeholder="Enter new password (min 6 characters)"
                className="peer block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
                aria-describedby="password-error"
                required
                minLength={6}
              />
              <KeyIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
            </div>
            <div id="password-error" aria-live="polite" aria-atomic="true">
              {passwordState.errors?.newPassword &&
                passwordState.errors.newPassword.map((error: string) => (
                  <p className="mt-2 text-sm text-red-500" key={error}>
                    {error}
                  </p>
                ))}
            </div>
          </div>

          <div aria-live="polite" aria-atomic="true">
            {passwordState.message ? (
              <p className={`mt-2 text-sm ${
                passwordState.message.includes('successfully') 
                  ? 'text-green-500' 
                  : 'text-red-500'
              }`}>
                {passwordState.message}
              </p>
            ) : null}
          </div>

          <div className="flex justify-end">
            <Button type="submit" className="bg-orange-600 hover:bg-orange-700">
              Change Password
            </Button>
          </div>
        </form>
      </div>

      {/* User Metadata */}
      <div className="rounded-lg bg-gray-50 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">User Information</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm font-medium text-gray-500">User ID</p>
            <p className="text-sm text-gray-900 font-mono">{user.id}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Username</p>
            <p className="text-sm text-gray-900">{user.slug}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Created</p>
            <p className="text-sm text-gray-900">{new Date(user.created_at).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Last Updated</p>
            <p className="text-sm text-gray-900">{new Date(user.updated_at).toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
