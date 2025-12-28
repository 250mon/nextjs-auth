import Link from "next/link";
import CompanyLogo from "@/app/ui/company-logo";
import { getCurrentUser } from "@/app/lib/dal";
import { User } from "@/app/lib/definitions";
import { getCurrentTranslations } from "@/app/lib/i18n";
import { auth } from "@/auth.config";
import ServerSignOutButton from "@/app/ui/server-sign-out-button";

export default async function SideNav({ NavLinks }: { NavLinks: React.ComponentType<{ user: User | null }> }) {
  const currentUser = await getCurrentUser();
  const session = await auth(); // Check for any session, regardless of user validity
  const { t } = await getCurrentTranslations();
  
  return (
    <div className="flex h-full flex-col px-3 py-4 md:px-2">
      <Link
        className="mb-2 hidden h-20 items-end justify-start rounded-md bg-blue-600 p-4 md:flex md:h-40"
        href="/"
      >
        <div className="w-32 text-white md:w-40">
          <CompanyLogo companyName={currentUser?.company_name} />
        </div>
      </Link>
      <div className="flex grow flex-col space-y-2">
        <nav role="navigation" aria-label="Main navigation">
          <NavLinks user={currentUser} />
        </nav>
        <div className="hidden h-auto w-full grow rounded-md bg-gray-50 md:block"></div>
        {session?.user?.id && (
          <div className="mt-2 md:mt-0">
            <ServerSignOutButton user={currentUser} signOutText={t('signOut')} />
          </div>
        )}
      </div>
    </div>
  );
}
