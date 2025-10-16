'use client';

import Link from 'next/link';
import { deleteUser } from '@/app/actions/admin-actions';
import { User } from '@/app/lib/definitions';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface DeleteUserFormProps {
  user: User;
}

export default function DeleteUserForm({ user }: DeleteUserFormProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const router = useRouter();
  
  const expectedConfirmText = `DELETE ${user.name}`;
  const isConfirmValid = confirmText === expectedConfirmText;

  const handleDelete = async () => {
    if (!isConfirmValid) return;
    
    setIsDeleting(true);
    try {
      const result = await deleteUser(user.id);
      if (result.message && !result.message.includes('Error')) {
        // Success - redirect to users list
        router.push('/dashboard/admin/users?deleted=true');
      } else {
        // Error - show message (you could add toast notification here)
        alert(result.message || 'Failed to delete user');
        setIsDeleting(false);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('An unexpected error occurred');
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Confirmation Input */}
      <div>
        <label htmlFor="confirmText" className="block text-sm font-medium text-gray-700 mb-2">
          To confirm deletion, type: <span className="font-mono text-red-600">{expectedConfirmText}</span>
        </label>
        <input
          id="confirmText"
          type="text"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
          placeholder={expectedConfirmText}
          disabled={isDeleting}
        />
        {confirmText && !isConfirmValid && (
          <p className="mt-1 text-sm text-red-600">
            Text doesn&apos;t match. Please type exactly: {expectedConfirmText}
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4 pt-4 border-t">
        <Link
          href="/dashboard/admin/users"
          className="flex h-10 items-center rounded-lg bg-gray-500 px-4 text-sm font-medium text-white transition-colors hover:bg-gray-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600"
        >
          Cancel
        </Link>
        <button
          onClick={handleDelete}
          disabled={!isConfirmValid || isDeleting}
          className={`flex h-10 items-center rounded-lg px-4 text-sm font-medium text-white transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
            !isConfirmValid || isDeleting
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-red-600 hover:bg-red-700 focus-visible:outline-red-600'
          }`}
        >
          {isDeleting ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Deleting...
            </>
          ) : (
            'Delete User Permanently'
          )}
        </button>
      </div>

      {/* Additional Safety Note */}
      <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
        <p><strong>Note:</strong> This action will immediately remove the user from the system. 
        The user will no longer be able to log in or access any resources. 
        Consider deactivating the user instead if you might need to restore access later.</p>
      </div>
    </div>
  );
}
