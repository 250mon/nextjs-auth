'use client';

import Link from 'next/link';
import { Button } from '@/app/ui/button';
import { createUser, UserState } from '@/app/actions/admin-actions';
import { useActionState, useEffect, useState } from 'react';
import { UserIcon, EnvelopeIcon, KeyIcon, IdentificationIcon } from '@heroicons/react/24/outline';
import { fetchAllTeams } from '@/app/actions/team-actions';
import { Team } from '@/app/lib/definitions';

export default function CreateUserForm() {
  const initialState: UserState = { message: '', errors: {} };
  const [state, formAction] = useActionState<UserState, FormData>(createUser, initialState);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<number[]>([]);

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
    <form action={formAction}>
      <div className="rounded-md bg-gray-50 p-4 md:p-6">
        {/* Name */}
        <div className="mb-4">
          <label htmlFor="name" className="mb-2 block text-sm font-medium">
            Full Name
          </label>
          <div className="relative mt-2 rounded-md">
            <div className="relative">
              <input
                id="name"
                name="name"
                type="text"
                placeholder="Enter full name"
                className="peer block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
                aria-describedby="name-error"
                required
              />
              <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
            </div>
            <div id="name-error" aria-live="polite" aria-atomic="true">
              {state.errors?.name &&
                state.errors.name.map((error: string) => (
                  <p className="mt-2 text-sm text-red-500" key={error}>
                    {error}
                  </p>
                ))}
            </div>
          </div>
        </div>

        {/* Email */}
        <div className="mb-4">
          <label htmlFor="email" className="mb-2 block text-sm font-medium">
            Email Address
          </label>
          <div className="relative mt-2 rounded-md">
            <div className="relative">
              <input
                id="email"
                name="email"
                type="email"
                placeholder="Enter email address"
                className="peer block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
                aria-describedby="email-error"
                required
              />
              <EnvelopeIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
            </div>
            <div id="email-error" aria-live="polite" aria-atomic="true">
              {state.errors?.email &&
                state.errors.email.map((error: string) => (
                  <p className="mt-2 text-sm text-red-500" key={error}>
                    {error}
                  </p>
                ))}
            </div>
          </div>
        </div>

        {/* Password */}
        <div className="mb-4">
          <label htmlFor="password" className="mb-2 block text-sm font-medium">
            Password
          </label>
          <div className="relative mt-2 rounded-md">
            <div className="relative">
              <input
                id="password"
                name="password"
                type="password"
                placeholder="Enter password (min 6 characters)"
                className="peer block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
                aria-describedby="password-error"
                required
                minLength={6}
              />
              <KeyIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
            </div>
            <div id="password-error" aria-live="polite" aria-atomic="true">
              {state.errors?.password &&
                state.errors.password.map((error: string) => (
                  <p className="mt-2 text-sm text-red-500" key={error}>
                    {error}
                  </p>
                ))}
            </div>
          </div>
        </div>

        {/* Slug */}
        <div className="mb-4">
          <label htmlFor="slug" className="mb-2 block text-sm font-medium">
            Username (URL Slug)
          </label>
          <div className="relative mt-2 rounded-md">
            <div className="relative">
              <input
                id="slug"
                name="slug"
                type="text"
                placeholder="Enter username (lowercase, no spaces)"
                className="peer block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
                aria-describedby="slug-error"
                required
                pattern="[a-z0-9-]+"
                title="Only lowercase letters, numbers, and hyphens allowed"
              />
              <IdentificationIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
            </div>
            <div id="slug-error" aria-live="polite" aria-atomic="true">
              {state.errors?.slug &&
                state.errors.slug.map((error: string) => (
                  <p className="mt-2 text-sm text-red-500" key={error}>
                    {error}
                  </p>
                ))}
            </div>
          </div>
        </div>

        {/* Teams */}
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium">
            Teams (Optional)
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

        {/* Admin Status */}
        <div className="mb-4">
          <div className="flex items-center">
            <input
              id="isadmin"
              name="isadmin"
              type="checkbox"
              value="true"
              className="h-4 w-4 rounded border-gray-300 bg-gray-100 text-blue-600 focus:ring-2 focus:ring-blue-500"
            />
            <label htmlFor="isadmin" className="ml-2 text-sm font-medium text-gray-900">
              Grant Administrator Privileges
            </label>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Administrators can access all system features and manage other users.
          </p>
        </div>

        <div aria-live="polite" aria-atomic="true">
          {state.message ? (
            <p className="mt-2 text-sm text-red-500">{state.message}</p>
          ) : null}
        </div>
      </div>
      
      <div className="mt-6 flex justify-end gap-4">
        <Link
          href="/dashboard/admin/users"
          className="flex h-10 items-center rounded-lg bg-gray-100 px-4 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200"
        >
          Cancel
        </Link>
        <Button type="submit">Create User</Button>
      </div>
    </form>
  );
}
