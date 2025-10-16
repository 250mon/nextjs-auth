import SideNav from "@/app/ui/sidenav";
import NavLinks from "@/app/ui/dashboard/nav-links";
import HamburgerMenu from "@/app/ui/dashboard/hamburger-menu";
import Link from "next/link";
import CompanyLogo from "@/app/ui/company-logo";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen flex-col md:flex-row md:overflow-hidden">
      <div className="md:hidden fixed top-0 left-0 w-full h-16 bg-blue-600 z-10 flex items-center px-4">
        <Link href="/">
          <div className="w-32 text-white">
            <CompanyLogo />
          </div>
        </Link>
      </div>
      <div className="w-full flex-none md:w-64">
        <HamburgerMenu>
          <SideNav NavLinks={NavLinks} />
        </HamburgerMenu>
      </div>
      <div className="flex-grow p-6 pt-20 md:overflow-y-auto md:p-12 md:pt-6">{children}</div>
    </div>
  );
}
