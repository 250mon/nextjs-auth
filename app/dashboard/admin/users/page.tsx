import { getCurrentUser } from "@/app/lib/dal";
import { notFound } from "next/navigation";
import { lusitana } from "@/app/ui/fonts";
import { Suspense } from "react";
import { UsersTableSkeleton } from "@/app/ui/skeletons";
import { CreateUser } from "@/app/ui/admin/users/buttons";
import UsersTable from "@/app/ui/admin/users/table";
import Search from "@/app/ui/search";


interface PageProps {
  searchParams?: Promise<{
    query?: string;
    page?: string;
    status?: string;
  }>;
}

export default async function UsersPage({ searchParams }: PageProps) {
  const currentUser = await getCurrentUser();
  
  // Only allow admins to access this page
  if (!currentUser?.isadmin) {
    notFound();
  }

  const searchParamsData = await searchParams;
  const query = searchParamsData?.query || '';
  const currentPage = Number(searchParamsData?.page) || 1;
  const status = searchParamsData?.status || 'all';

  return (
    <div className="w-full">
      <div className="flex w-full items-center justify-between">
        <h1 className={`${lusitana.className} text-2xl`}>User Management</h1>
      </div>
      
      <div className="mt-4 flex items-center justify-between gap-2 md:mt-8">
        <Search placeholder="Search users by name or email..." />
        <div className="flex gap-2">
          <CreateUser />
        </div>
      </div>

      <Suspense key={query + currentPage + status} fallback={<UsersTableSkeleton />}>
        <UsersTable 
          query={query} 
          currentPage={currentPage}
          status={status}
        />
      </Suspense>
    </div>
  );
}
