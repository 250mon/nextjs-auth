import { getInvitationByToken } from '@/app/actions/admin/invitation-actions';
import { notFound } from 'next/navigation';
import AcceptInvitationForm from '@/app/ui/invitations/accept-form';
import AcceptInvitationSimple from '@/app/ui/invitations/accept-simple';

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function InvitePage({ params }: PageProps) {
  const { token } = await params;
  const invitation = await getInvitationByToken(token);

  if (!invitation) {
    notFound();
  }

  if (invitation.status !== 'pending') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Invitation {invitation.status}</h1>
          <p className="text-gray-600">
            {invitation.status === 'accepted' && 'This invitation has already been accepted.'}
            {invitation.status === 'expired' && 'This invitation has expired.'}
            {invitation.status === 'revoked' && 'This invitation has been revoked.'}
          </p>
        </div>
      </div>
    );
  }

  // Check if user already exists (from the invitation data)
  type InvitationWithUser = typeof invitation & { existingUser?: { id: string; name: string; hasCompany: boolean } };
  const invitationWithUser = invitation as InvitationWithUser;
  const existingUser = invitationWithUser.existingUser;
  const isExistingUser = existingUser && !existingUser.hasCompany;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Accept Invitation</h1>
          <p className="text-gray-600">
            You&apos;ve been invited to join <strong className="text-blue-600">{invitation.company_name || 'a company'}</strong>.
          </p>
          {isExistingUser ? (
            <p className="text-sm text-gray-500 mt-2">
              Welcome back, {existingUser.name}! Click below to join the company.
            </p>
          ) : (
            <p className="text-sm text-gray-500 mt-2">
              Please complete your account setup below to get started.
            </p>
          )}
        </div>
        {isExistingUser ? (
          <AcceptInvitationSimple invitation={invitation} />
        ) : (
          <AcceptInvitationForm invitation={invitation} />
        )}
      </div>
    </div>
  );
}

