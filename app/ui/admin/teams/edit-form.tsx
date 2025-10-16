'use client';

import Link from 'next/link';
import { Button } from '@/app/ui/button';
import { updateTeamAction, TeamState } from '@/app/actions/team-actions';
import { useActionState } from 'react';
import { Team } from '@/app/lib/definitions';
import { BuildingOfficeIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

export default function EditTeamForm({ team }: { team: Team }) {
  const initialState: TeamState = { message: '', errors: {} };
  const updateTeamWithId = updateTeamAction.bind(null, team.id);
  const [state, formAction] = useActionState(updateTeamWithId, initialState);

  return (
    <div className="space-y-8">
      {/* Team Information Form */}
      <div className="rounded-lg bg-gray-50 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Information</h3>
        <form action={formAction}>
          <div className="space-y-4">
            {/* Team Name */}
            <div>
              <label htmlFor="name" className="mb-2 block text-sm font-medium">
                Team Name
              </label>
              <div className="relative">
                <input
                  id="name"
                  name="name"
                  type="text"
                  defaultValue={team.name}
                  placeholder="Enter team name"
                  className="peer block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
                  aria-describedby="name-error"
                  required
                />
                <BuildingOfficeIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
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

            {/* Description */}
            <div>
              <label htmlFor="description" className="mb-2 block text-sm font-medium">
                Description
              </label>
              <div className="relative">
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  defaultValue={team.description || ''}
                  placeholder="Enter team description"
                  className="peer block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500 resize-none"
                  aria-describedby="description-error"
                />
                <DocumentTextIcon className="pointer-events-none absolute left-3 top-3 h-[18px] w-[18px] text-gray-500 peer-focus:text-gray-900" />
              </div>
              <div id="description-error" aria-live="polite" aria-atomic="true">
                {state.errors?.description &&
                  state.errors.description.map((error: string) => (
                    <p className="mt-2 text-sm text-red-500" key={error}>
                      {error}
                    </p>
                  ))}
              </div>
            </div>
          </div>

          <div aria-live="polite" aria-atomic="true">
            {state.message ? (
              <p className="mt-2 text-sm text-red-500">{state.message}</p>
            ) : null}
          </div>

          <div className="flex justify-end gap-4 mt-6">
            <Link
              href="/dashboard/admin/teams"
              className="flex h-10 items-center rounded-lg bg-gray-100 px-4 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200"
            >
              Cancel
            </Link>
            <Button type="submit">Update Team</Button>
          </div>
        </form>
      </div>

      {/* Team Metadata */}
      <div className="rounded-lg bg-gray-50 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Information</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm font-medium text-gray-500">Team ID</p>
            <p className="text-sm text-gray-900 font-mono">{team.id}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Created</p>
            <p className="text-sm text-gray-900">{new Date(team.created_at).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Last Updated</p>
            <p className="text-sm text-gray-900">{new Date(team.updated_at).toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
