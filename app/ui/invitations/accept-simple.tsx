'use client';

import { Button } from '@/app/ui/button';
import { acceptInvitationSimple } from '@/app/actions/admin/invitation-actions';
import { useState } from 'react';
import { Invitation } from '@/app/lib/definitions';
import { useRouter } from 'next/navigation';

interface AcceptInvitationSimpleProps {
  invitation: Invitation & { company_name?: string; existingUser?: { id: string; name: string; hasCompany: boolean } };
}

export default function AcceptInvitationSimple({ invitation }: AcceptInvitationSimpleProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');
  const router = useRouter();

  const handleAccept = async () => {
    setIsSubmitting(true);
    setError('');
    setMessage('');

    try {
      const result = await acceptInvitationSimple(invitation.token);
      
      if (result.message && !result.message.includes('Error') && !result.message.includes('Invalid') && !result.message.includes('expired') && !result.message.includes('revoked')) {
        setMessage(result.message);
        setTimeout(() => {
          router.push('/login?message=You have successfully joined the company. Please log in.');
        }, 2000);
      } else {
        setError(result.message || 'Failed to accept invitation');
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error('Error accepting invitation:', err);
      setError('An unexpected error occurred');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* User Info Display */}
      <div className="rounded-lg bg-blue-50 p-4 border border-blue-200">
        <div className="space-y-2">
          <div>
            <p className="text-sm font-medium text-gray-700">Email</p>
            <p className="text-sm text-gray-900">{invitation.email}</p>
          </div>
          {invitation.existingUser && (
            <div>
              <p className="text-sm font-medium text-gray-700">Name</p>
              <p className="text-sm text-gray-900">{invitation.existingUser.name}</p>
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-gray-700">Role</p>
            <p className="text-sm text-gray-900 capitalize">{invitation.role}</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      {message && (
        <div className="rounded-lg bg-green-50 p-4 border border-green-200">
          <p className="text-sm text-green-800">{message}</p>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 p-4 border border-red-200">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <Button 
        onClick={handleAccept}
        disabled={isSubmitting || !!message}
        className="w-full bg-blue-600 hover:bg-blue-700"
      >
        {isSubmitting ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Joining...
          </>
        ) : message ? (
          'Success! Redirecting...'
        ) : (
          'Join Company'
        )}
      </Button>
      
      <p className="text-xs text-center text-gray-500 mt-4">
        By accepting, you agree to join {invitation.company_name || 'the company'}.
      </p>
    </div>
  );
}

