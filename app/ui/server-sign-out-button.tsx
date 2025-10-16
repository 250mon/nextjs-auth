import { PowerIcon } from "@heroicons/react/24/outline";
import { customSignOut } from "@/app/actions/auth";
import { User } from "@/app/lib/definitions";

interface ServerSignOutButtonProps {
  user: User | null;
  signOutText: string;
}

export default function ServerSignOutButton({ user, signOutText }: ServerSignOutButtonProps) {
  return (
    <form
      action={async () => {
        "use server";
        await customSignOut({ redirectTo: "/" });
      }}
    >
      <button className="flex h-[48px] w-full items-center gap-2 rounded-md bg-gray-50 p-3 text-sm font-medium hover:bg-sky-100 hover:text-blue-600 md:justify-start md:p-2 md:px-3">
        <PowerIcon className="w-6" />
        <div className="block md:block">
          {user?.name || 'Invalid User'} {signOutText}
        </div>
      </button>
    </form>
  );
}
