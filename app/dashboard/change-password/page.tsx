import { getCurrentUser } from "@/app/lib/dal";
import { redirect } from "next/navigation";
import { getCurrentTranslations } from "@/app/lib/i18n";
import ChangePasswordForm from "@/app/ui/profile/change-password-form";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

// Force dynamic rendering since we need to access the current user
export const dynamic = 'force-dynamic';

export default async function ChangePasswordPage() {
  const user = await getCurrentUser();
  const { t } = await getCurrentTranslations();

  if (!user) {
    redirect("/login");
  }

  // Not required (e.g. visited directly) — send back to the dashboard.
  if (!user.must_change_password) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-6 md:p-24">
      <div className="w-full max-w-lg">
        <div className="rounded-lg bg-white p-6 shadow-md">
          <div className="mb-6 flex items-start gap-3 rounded-md border border-amber-200 bg-amber-50 p-4">
            <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
            <div>
              <h1 className="text-lg font-bold text-gray-900">{t('passwordChangeRequired')}</h1>
              <p className="text-sm text-gray-600">{t('passwordChangeRequiredDescription')}</p>
            </div>
          </div>

          <ChangePasswordForm />
        </div>
      </div>
    </main>
  );
}
