import { PencilIcon, PlusIcon, TrashIcon, UserIcon, EyeSlashIcon, EyeIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { toggleUserStatus } from '@/app/actions/admin/user-actions';

export function CreateUser() {
  return (
    <Link
      href="/dashboard/admin/users/create"
      className="flex h-10 items-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
    >
      <span className="hidden md:block">Create User</span>{' '}
      <PlusIcon className="h-5 md:ml-4" />
    </Link>
  );
}

export function UpdateUser({ id }: { id: string }) {
  return (
    <Link
      href={`/dashboard/admin/users/${id}/edit`}
      className="rounded-md border p-2 hover:bg-gray-100"
    >
      <PencilIcon className="w-5" />
    </Link>
  );
}

export function ViewUser({ slug }: { slug: string }) {
  return (
    <Link
      href={`/profile/${slug}`}
      className="rounded-md border p-2 hover:bg-gray-100"
      title="View Profile"
    >
      <UserIcon className="w-5" />
    </Link>
  );
}

export function ToggleUserStatus({ id, isActive }: { id: string; isActive: boolean }) {
  const toggleUserStatusWithId = toggleUserStatus.bind(null, id);

  return (
    <form action={toggleUserStatusWithId}>
      <button 
        className={`rounded-md border p-2 hover:bg-gray-100 ${
          isActive ? 'text-green-600' : 'text-red-600'
        }`}
        title={isActive ? 'Deactivate User' : 'Activate User'}
      >
        {isActive ? <EyeIcon className="w-5" /> : <EyeSlashIcon className="w-5" />}
      </button>
    </form>
  );
}

export function DeleteUser({ id }: { id: string }) {
  return (
    <Link
      href={`/dashboard/admin/users/${id}/delete`}
      className="rounded-md border p-2 hover:bg-gray-100 text-red-600 inline-flex items-center justify-center"
      title="Delete User"
    >
      <TrashIcon className="w-5" />
    </Link>
  );
}
