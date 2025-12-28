import { getCurrentUser } from "@/app/lib/dal";
import { notFound } from "next/navigation";
import { fetchCompanyById } from "@/app/actions/admin/company-actions";
import Breadcrumbs from '@/app/ui/breadcrumbs';
import { lusitana } from '@/app/ui/fonts';
import DeleteCompanyForm from '@/app/ui/admin/companies/delete-form';

export default async function DeleteCompanyPage({ params }: { params: Promise<{ id: string }> }) {
  const currentUser = await getCurrentUser();

  // Only allow super admins to access this page
  if (!currentUser?.is_super_admin) {
    notFound();
  }

  const { id } = await params;
  const companyToDelete = await fetchCompanyById(id);

  if (!companyToDelete) {
    notFound();
  }

  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: 'Admin', href: '/dashboard/admin' },
          { label: 'Company Management', href: '/dashboard/admin/companies' },
          {
            label: 'Delete Company',
            href: `/dashboard/admin/companies/${id}/delete`,
            active: true,
          },
        ]}
      />
      <div className="max-w-2xl">
        <h1 className={`${lusitana.className} text-2xl mb-6 text-red-600`}>Delete Company</h1>
        
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
                  You are about to permanently delete this company. This will:
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Remove the company from the system</li>
                  <li>Unlink all users associated with this company (set company_id to NULL)</li>
                  <li>Remove all company-related data</li>
                </ul>
                <p className="mt-2 font-medium">
                  Users will remain in the system but will no longer be associated with this company.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Company Information */}
        <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Company to be deleted:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-700">Name</p>
              <p className="text-sm text-gray-900">{companyToDelete.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Description</p>
              <p className="text-sm text-gray-900">{companyToDelete.description || 'No description'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Created</p>
              <p className="text-sm text-gray-900">{new Date(companyToDelete.created_at).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Last Updated</p>
              <p className="text-sm text-gray-900">{new Date(companyToDelete.updated_at).toLocaleString()}</p>
            </div>
          </div>
        </div>

        <DeleteCompanyForm company={companyToDelete} />
      </div>
    </main>
  );
}

