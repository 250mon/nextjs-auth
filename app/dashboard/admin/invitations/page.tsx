import { getCurrentUser } from "@/app/lib/dal";
import { notFound } from "next/navigation";
import { lusitana } from "@/app/ui/fonts";
import { Suspense } from "react";
import { CreateInvitation } from "@/app/ui/admin/invitations/buttons";
import InvitationsTable from "@/app/ui/admin/invitations/table";
import { UsersTableSkeleton } from "@/app/ui/skeletons";
import Search from "@/app/ui/search";

interface PageProps {
  searchParams?: Promise<{
    query?: string;
  }>;
}

export default async function InvitationsPage({ searchParams }: PageProps) {
  const currentUser = await getCurrentUser();
  
  // Only allow admins to access this page
  if (!currentUser?.isadmin) {
    notFound();
  }

  const searchParamsData = await searchParams;
  const query = searchParamsData?.query || '';

  return (
    <div className="w-full">
      <div className="flex w-full items-center justify-between">
        <h1 className={`${lusitana.className} text-2xl`}>Invitation Management</h1>
      </div>
      
      <div className="mt-4 flex items-center justify-between gap-2 md:mt-8">
        <Search placeholder="Search invitations by email or company..." />
        <div className="flex gap-2">
          <CreateInvitation />
        </div>
      </div>

      <Suspense key={query} fallback={<UsersTableSkeleton />}>
        <InvitationsTable query={query} />
      </Suspense>
    </div>
  );
}

