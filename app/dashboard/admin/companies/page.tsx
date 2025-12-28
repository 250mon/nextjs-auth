import { getCurrentUser } from "@/app/lib/dal";
import { notFound } from "next/navigation";
import { lusitana } from "@/app/ui/fonts";
import { Suspense } from "react";
import { CompaniesTableSkeleton } from "@/app/ui/skeletons";
import { CreateCompany } from "@/app/ui/admin/companies/buttons";
import CompaniesTable from "@/app/ui/admin/companies/table";
import Search from "@/app/ui/search";


interface PageProps {
  searchParams?: Promise<{
    query?: string;
    page?: string;
  }>;
}

export default async function CompaniesPage({ searchParams }: PageProps) {
  const currentUser = await getCurrentUser();
  
  // Only allow super admins to access this page
  if (!currentUser?.is_super_admin) {
    notFound();
  }

  const searchParamsData = await searchParams;
  const query = searchParamsData?.query || '';
  const currentPage = Number(searchParamsData?.page) || 1;

  return (
    <div className="w-full">
      <div className="flex w-full items-center justify-between">
        <h1 className={`${lusitana.className} text-2xl`}>Company Management</h1>
      </div>
      
      <div className="mt-4 flex items-center justify-between gap-2 md:mt-8">
        <Search placeholder="Search companies by name or description..." />
        <div className="flex gap-2">
          <CreateCompany />
        </div>
      </div>

      <Suspense key={query + currentPage} fallback={<CompaniesTableSkeleton />}>
        <CompaniesTable 
          query={query} 
          currentPage={currentPage}
        />
      </Suspense>
    </div>
  );
}

