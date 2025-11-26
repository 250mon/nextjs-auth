import { getCurrentUser } from "@/app/lib/dal";
import { notFound } from "next/navigation";
import { lusitana } from "@/app/ui/fonts";
import Link from "next/link";
import { 
  UserGroupIcon, 
  Cog6ToothIcon, 
  ChartBarIcon,
  DocumentTextIcon 
} from "@heroicons/react/24/outline";

export default async function AdminPage() {
  const currentUser = await getCurrentUser();
  
  // Only allow admins to access this page
  if (!currentUser?.isadmin) {
    notFound();
  }

  const adminSections = [
    {
      title: "User Management",
      description: "Manage users, roles, and permissions",
      href: "/dashboard/admin/users",
      icon: UserGroupIcon,
      color: "bg-blue-500"
    },
    {
      title: "System Settings",
      description: "Configure system-wide settings",
      href: "/dashboard/admin/system",
      icon: Cog6ToothIcon,
      color: "bg-green-500"
    },
    {
      title: "Analytics",
      description: "View system analytics and reports",
      href: "/dashboard/admin/analytics",
      icon: ChartBarIcon,
      color: "bg-purple-500"
    },
    {
      title: "Audit Logs",
      description: "Review system activity and audit trails",
      href: "/dashboard/admin/logs",
      icon: DocumentTextIcon,
      color: "bg-orange-500"
    }
  ];

  return (
    <div className="w-full">
      <div className="flex w-full items-center justify-between mb-6">
        <h1 className={`${lusitana.className} text-2xl`}>Admin Dashboard</h1>
      </div>
      
      <div className="mb-6">
        <p className="text-gray-600">
          Welcome to the admin dashboard. Here you can manage all aspects of the system.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
        {adminSections.map((section) => {
          const IconComponent = section.icon;
          return (
            <Link
              key={section.title}
              href={section.href}
              className="group block rounded-lg border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center space-x-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${section.color}`}>
                  <IconComponent className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600">
                    {section.title}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {section.description}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-8 rounded-lg bg-yellow-50 border border-yellow-200 p-4">
        <div className="flex items-center">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              Admin Access
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>
                You are currently logged in as an administrator. Please use these tools responsibly 
                and ensure all changes are properly documented.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
