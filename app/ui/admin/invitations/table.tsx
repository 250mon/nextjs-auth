import { RevokeInvitation, CopyInvitationLink } from '@/app/ui/admin/invitations/buttons';
import { formatDateToLocal } from '@/app/lib/utils';
import { fetchInvitations } from '@/app/actions/admin/invitation-actions';
import { EnvelopeIcon } from '@heroicons/react/24/outline';

export default async function InvitationsTable({ query = '' }: { query?: string }) {
  const invitations = await fetchInvitations(query);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'expired':
        return 'bg-gray-100 text-gray-800';
      case 'revoked':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="mt-6 flow-root">
      <div className="inline-block min-w-full align-middle">
        <div className="rounded-lg bg-gray-50 p-2 md:pt-0">
          <div className="md:hidden">
            {invitations?.map((invitation) => (
              <div
                key={invitation.id}
                className="mb-2 w-full rounded-md bg-white p-4"
              >
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <div className="mb-2 flex items-center">
                      <EnvelopeIcon className="mr-2 h-5 w-5 text-gray-500" />
                      <p className="text-sm font-medium">{invitation.email}</p>
                    </div>
                    {invitation.company_name && (
                      <p className="text-sm text-gray-500">{invitation.company_name}</p>
                    )}
                  </div>
                  <div className={`inline-flex items-center rounded-full px-2 py-1 text-xs ${getStatusColor(invitation.status)}`}>
                    {invitation.status}
                  </div>
                </div>
                <div className="flex w-full items-center justify-between pt-4">
                  <div>
                    <p className="text-sm text-gray-500">
                      Role: {invitation.role}
                    </p>
                    <p className="text-sm text-gray-500">
                      Expires: {formatDateToLocal(invitation.expires_at.toString())}
                    </p>
                  </div>
                  {invitation.status === 'pending' && (
                    <div className="flex justify-end gap-2">
                      <CopyInvitationLink token={invitation.token} />
                      <RevokeInvitation id={invitation.id} />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <table className="hidden min-w-full text-gray-900 md:table">
            <thead className="rounded-lg text-left text-sm font-normal">
              <tr>
                <th scope="col" className="px-4 py-5 font-medium sm:pl-6">
                  Email
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  Company
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  Role
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  Status
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  Expires
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  Created
                </th>
                <th scope="col" className="relative py-3 pl-6 pr-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {invitations?.map((invitation) => (
                <tr
                  key={invitation.id}
                  className="w-full border-b py-3 text-sm last-of-type:border-none [&:first-child>td:first-child]:rounded-tl-lg [&:first-child>td:last-child]:rounded-tr-lg [&:last-child>td:first-child]:rounded-bl-lg [&:last-child>td:last-child]:rounded-br-lg"
                >
                  <td className="whitespace-nowrap py-3 pl-6 pr-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <EnvelopeIcon className="h-5 w-5 text-blue-600" />
                      </div>
                      <p className="font-medium">{invitation.email}</p>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <p className="text-sm text-gray-600">
                      {invitation.company_name || 'N/A'}
                    </p>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800">
                      {invitation.role}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    <div className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(invitation.status)}`}>
                      {invitation.status}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    {formatDateToLocal(invitation.expires_at.toString())}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    {formatDateToLocal(invitation.created_at.toString())}
                  </td>
                  <td className="whitespace-nowrap py-3 pl-6 pr-3">
                    {invitation.status === 'pending' && (
                      <div className="flex justify-end gap-3">
                        <CopyInvitationLink token={invitation.token} />
                        <RevokeInvitation id={invitation.id} />
                      </div>
                    )}
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

