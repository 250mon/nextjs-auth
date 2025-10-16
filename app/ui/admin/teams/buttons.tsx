"use client";

import { PencilIcon, PlusIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { deleteTeamAction } from '@/app/actions/team-actions';

export function CreateTeam() {
  return (
    <Link
      href="/dashboard/admin/teams/create"
      className="flex h-10 items-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
    >
      <span className="hidden md:block">Create Team</span>{' '}
      <PlusIcon className="h-5 md:ml-4" />
    </Link>
  );
}

export function UpdateTeam({ id }: { id: number }) {
  return (
    <Link
      href={`/dashboard/admin/teams/${id}/edit`}
      className="rounded-md border p-2 hover:bg-gray-100"
    >
      <PencilIcon className="w-5" />
    </Link>
  );
}

export function ViewTeam({ id }: { id: number }) {
  return (
    <Link
      href={`/dashboard/admin/teams/${id}`}
      className="rounded-md border p-2 hover:bg-gray-100"
    >
      <EyeIcon className="w-5" />
    </Link>
  );
}

export function DeleteTeam({ 
  id, 
  name, 
  memberCount 
}: { 
  id: number; 
  name: string; 
  memberCount: number; 
}) {
  const deleteTeamWithId = deleteTeamAction.bind(null, id);

  if (memberCount > 0) {
    return (
      <button
        disabled
        className="rounded-md border p-2 bg-gray-100 text-gray-400 cursor-not-allowed"
        title={`Cannot delete team with ${memberCount} members`}
      >
        <TrashIcon className="w-5" />
      </button>
    );
  }

  return (
    <form action={deleteTeamWithId}>
      <button 
        className="rounded-md border p-2 hover:bg-gray-100"
        onClick={(e) => {
          if (!confirm(`Are you sure you want to delete the team "${name}"?`)) {
            e.preventDefault();
          }
        }}
      >
        <span className="sr-only">Delete</span>
        <TrashIcon className="w-5" />
      </button>
    </form>
  );
}
