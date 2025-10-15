import { getCurrentUser } from "@/app/lib/dal";
import { notFound } from "next/navigation";
import { fetchUserById } from "@/app/actions/admin-actions";
import Breadcrumbs from '@/app/ui/breadcrumbs';
import { lusitana } from '@/app/ui/fonts';
import DeleteUserForm from '@/app/ui/admin/users/delete-form';

export default async function DeleteUserPage({ params }: { params: Promise<{ id: string }> }) {
  const currentUser = await getCurrentUser();

  // Only allow admins to access this page
  if (!currentUser?.isadmin) {
    notFound();
  }

  const { id } = await params;
  const userToDelete = await fetchUserById(id);

  if (!userToDelete) {
    notFound();
  }

  // Prevent users from deleting themselves
  if (currentUser.id === userToDelete.id) {
    notFound();
  }

  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: 'Admin', href: '/dashboard/admin' },
          { label: 'User Management', href: '/dashboard/admin/users' },
          {
            label: 'Delete User',
            href: `/dashboard/admin/users/${id}/delete`,
            active: true,
          },
        ]}
      />
      <div className="max-w-2xl">
        <h1 className={`${lusitana.className} text-2xl mb-6 text-red-600`}>Delete User</h1>
        
        {/* Warning Section */}
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Warning: This action cannot be undone
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>
                  You are about to permanently delete this user account. This will remove:
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>User profile and account information</li>
                  <li>Access to the system</li>
                  <li>All associated permissions</li>
                </ul>
                <p className="mt-2 font-medium">
                  Transaction history will be preserved for audit purposes.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* User Information */}
        <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-3">User to be deleted:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-700">Name</p>
              <p className="text-sm text-gray-900">{userToDelete.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Email</p>
              <p className="text-sm text-gray-900">{userToDelete.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Role</p>
              <p className="text-sm text-gray-900">
                {userToDelete.isadmin ? 'Administrator' : 'User'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Team</p>
              <p className="text-sm text-gray-900">{userToDelete.teams?.map(t => t.name).join(', ') || 'No teams assigned'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Status</p>
              <p className={`text-sm font-medium ${userToDelete.active ? 'text-green-600' : 'text-red-600'}`}>
                {userToDelete.active ? 'Active' : 'Inactive'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Profile URL</p>
              <p className="text-sm text-gray-900">/profile/{userToDelete.slug}</p>
            </div>
          </div>
        </div>

        <DeleteUserForm user={userToDelete} />
      </div>
    </main>
  );
}
