import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { revokeInvitation } from '@/app/actions/admin/invitation-actions';
import { CopyInvitationLink } from './copy-link-button';

export function CreateInvitation() {
  return (
    <Link
      href="/dashboard/admin/invitations/create"
      className="flex h-10 items-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
    >
      <span className="hidden md:block">Send Invitation</span>{' '}
      <PlusIcon className="h-5 md:ml-4" />
    </Link>
  );
}

export function RevokeInvitation({ id }: { id: string }) {
  const revokeInvitationWithId = revokeInvitation.bind(null, id, undefined);

  return (
    <form action={revokeInvitationWithId}>
      <button
        type="submit"
        className="rounded-md border p-2 hover:bg-gray-100 text-red-600 inline-flex items-center justify-center"
        title="Revoke Invitation"
      >
        <XMarkIcon className="w-5" />
      </button>
    </form>
  );
}

export { CopyInvitationLink };

