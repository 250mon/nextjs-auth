import { PencilIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export function CreateCompany() {
  return (
    <Link
      href="/dashboard/admin/companies/create"
      className="flex h-10 items-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
    >
      <span className="hidden md:block">Create Company</span>{' '}
      <PlusIcon className="h-5 md:ml-4" />
    </Link>
  );
}

export function UpdateCompany({ id }: { id: string }) {
  return (
    <Link
      href={`/dashboard/admin/companies/${id}/edit`}
      className="rounded-md border p-2 hover:bg-gray-100"
      title="Edit Company"
    >
      <PencilIcon className="w-5" />
    </Link>
  );
}

export function DeleteCompany({ id }: { id: string }) {
  return (
    <Link
      href={`/dashboard/admin/companies/${id}/delete`}
      className="rounded-md border p-2 hover:bg-gray-100 text-red-600 inline-flex items-center justify-center"
      title="Delete Company"
    >
      <TrashIcon className="w-5" />
    </Link>
  );
}

