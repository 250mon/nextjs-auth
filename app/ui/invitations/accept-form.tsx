'use client';

import { Button } from '@/app/ui/button';
import { acceptInvitation, AcceptInvitationState } from '@/app/actions/admin/invitation-actions';
import { useActionState } from 'react';
import { Invitation } from '@/app/lib/definitions';
import { UserIcon, KeyIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';

interface AcceptInvitationFormProps {
  invitation: Invitation & { company_name?: string };
}

export default function AcceptInvitationForm({ invitation }: AcceptInvitationFormProps) {
  const initialState: AcceptInvitationState = { message: '', errors: {} };
  const [state, formAction] = useActionState<AcceptInvitationState, FormData>(acceptInvitation, initialState);
  const router = useRouter();

  // Redirect on success
  if (state.message && state.message.includes('successfully')) {
    setTimeout(() => {
      router.push('/login?message=Account created successfully. Please log in.');
    }, 2000);
  }

  return (
    <form action={formAction}>
      <input type="hidden" name="token" value={invitation.token} />
      
      <div className="space-y-5">
        {/* Email (read-only) */}
        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-medium">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={invitation.email}
            disabled
            className="block w-full rounded-md border border-gray-200 bg-gray-100 py-2 px-3 text-sm text-gray-600"
          />
        </div>

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
              placeholder="Enter your full name"
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

        {/* Password */}
        <div>
          <label htmlFor="password" className="mb-2 block text-sm font-medium">
            Password
          </label>
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

        {/* Confirm Password */}
        <div>
          <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium">
            Confirm Password
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="Re-enter password to confirm"
              className="peer block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
              aria-describedby="confirmPassword-error"
              required
              minLength={6}
            />
            <KeyIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
          </div>
          <div id="confirmPassword-error" aria-live="polite" aria-atomic="true">
            {state.errors?.confirmPassword &&
              state.errors.confirmPassword.map((error: string) => (
                <p className="mt-2 text-sm text-red-500" key={error}>
                  {error}
                </p>
              ))}
          </div>
        </div>

        {/* Role (read-only) */}
        <div>
          <label htmlFor="role" className="mb-2 block text-sm font-medium">
            Role
          </label>
          <input
            id="role"
            type="text"
            value={invitation.role}
            disabled
            className="block w-full rounded-md border border-gray-200 bg-gray-100 py-2 px-3 text-sm text-gray-600 capitalize"
          />
        </div>

        <div aria-live="polite" aria-atomic="true">
          {state.message ? (
            <p className={`mt-2 text-sm ${
              state.message.includes('successfully') 
                ? 'text-green-500' 
                : 'text-red-500'
            }`}>
              {state.message}
            </p>
          ) : null}
        </div>

        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
          Create Account & Join Company
        </Button>
        
        <p className="text-xs text-center text-gray-500 mt-4">
          By creating an account, you agree to join {invitation.company_name || 'the company'}.
        </p>
      </div>
    </form>
  );
}

