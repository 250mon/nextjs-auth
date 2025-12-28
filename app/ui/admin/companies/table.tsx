import { UpdateCompany, DeleteCompany } from '@/app/ui/admin/companies/buttons';
import { formatDateToLocal } from '@/app/lib/utils';
import { fetchFilteredCompanies } from '@/app/actions/admin/company-actions';
import { BuildingOfficeIcon } from '@heroicons/react/24/outline';

export default async function CompaniesTable({
  query,
  currentPage,
}: {
  query: string;
  currentPage: number;
}) {
  const companies = await fetchFilteredCompanies(query, currentPage);

  return (
    <div className="mt-6 flow-root">
      <div className="inline-block min-w-full align-middle">
        <div className="rounded-lg bg-gray-50 p-2 md:pt-0">
          <div className="md:hidden">
            {companies?.map((company) => (
              <div
                key={company.id}
                className="mb-2 w-full rounded-md bg-white p-4"
              >
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <div className="mb-2 flex items-center">
                      <BuildingOfficeIcon className="mr-2 h-5 w-5 text-gray-500" />
                      <p className="text-sm font-medium">{company.name}</p>
                    </div>
                    {company.description && (
                      <p className="text-sm text-gray-500">{company.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex w-full items-center justify-between pt-4">
                  <div>
                    <p className="text-sm text-gray-500">
                      Created: {formatDateToLocal(company.created_at.toString())}
                    </p>
                  </div>
                  <div className="flex justify-end gap-2">
                    <UpdateCompany id={company.id} />
                    <DeleteCompany id={company.id} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <table className="hidden min-w-full text-gray-900 md:table">
            <thead className="rounded-lg text-left text-sm font-normal">
              <tr>
                <th scope="col" className="px-4 py-5 font-medium sm:pl-6">
                  Company
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  Description
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  Created
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  Updated
                </th>
                <th scope="col" className="relative py-3 pl-6 pr-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {companies?.map((company) => (
                <tr
                  key={company.id}
                  className="w-full border-b py-3 text-sm last-of-type:border-none [&:first-child>td:first-child]:rounded-tl-lg [&:first-child>td:last-child]:rounded-tr-lg [&:last-child>td:first-child]:rounded-bl-lg [&:last-child>td:last-child]:rounded-br-lg"
                >
                  <td className="whitespace-nowrap py-3 pl-6 pr-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <BuildingOfficeIcon className="h-5 w-5 text-blue-600" />
                      </div>
                      <p className="font-medium">{company.name}</p>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <p className="text-sm text-gray-600 max-w-md truncate">
                      {company.description || <span className="text-gray-400 italic">No description</span>}
                    </p>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    {formatDateToLocal(company.created_at.toString())}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    {formatDateToLocal(company.updated_at.toString())}
                  </td>
                  <td className="whitespace-nowrap py-3 pl-6 pr-3">
                    <div className="flex justify-end gap-3">
                      <UpdateCompany id={company.id} />
                      <DeleteCompany id={company.id} />
                    </div>
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

