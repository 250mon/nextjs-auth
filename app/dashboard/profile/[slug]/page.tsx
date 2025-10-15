import { getProfileDTO } from "@/app/lib/dto";
import { auth } from "@/app/actions/auth";
import { notFound } from "next/navigation";
import { getCurrentTranslations } from "@/app/lib/i18n";
import { getCurrentUser } from "@/app/lib/dal";
import Link from "next/link";
import { ShieldCheckIcon } from "@heroicons/react/24/outline";

interface PageProps {
  params: Promise<{slug: string}>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ProfilePage({ params, searchParams }: PageProps) {
  try {
    const { slug } = await params;
    const searchParamsData = await searchParams;
    const profile = await getProfileDTO(slug);
    
    // Get current session and user to check permissions
    const session = await auth();
    const currentUser = await getCurrentUser();
    const isOwnProfile = session?.user?.id === profile.id;
    const isAdmin = currentUser?.isadmin || false;

    const { t } = await getCurrentTranslations();

    // Check for success messages
    const updated = searchParamsData?.updated;
    const successMessage = updated === 'profile' 
      ? t('profileUpdatedSuccessfully')
      : updated === 'password' 
      ? t('passwordChangedSuccessfully')
      : null;

    return (
      <main className="flex min-h-screen flex-col items-center p-6 md:p-24">
        <div className="w-full max-w-4xl rounded-lg bg-white p-6 shadow-md">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">{t('profile')}</h1>
            <div className="flex gap-2">
              {isOwnProfile && (
                <Link
                  href={`/profile/${slug}/edit`}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                > {t('editProfile')}
                </Link>
              )}
              {isAdmin && !isOwnProfile && (
                <Link
                  href={`/profile/${slug}/edit`}
                  className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
                >
                  <ShieldCheckIcon className="w-4 h-4" />
                  {t('editAsAdmin')}
                </Link>
              )}
            </div>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
              {successMessage}
            </div>
          )}
          
          {/* Profile Information */}
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <span className="w-32 font-semibold">{t('name')}:</span>
              <span className="text-gray-700">
                {profile.name || t('notAvailable')}
              </span>
            </div>

            <div className="flex items-center space-x-4">
              <span className="w-32 font-semibold">{t('email')}:</span>
              <span className="text-gray-700">
                {profile.email || t('notAvailable')}
              </span>
            </div>

            {profile.isadmin && (
              <div className="flex items-center space-x-4">
                <span className="w-32 font-semibold">{t('isAdmin')}:</span>
                <span className="text-gray-700">
                  {profile.isadmin ? t('yes') : t('no')}
                </span>
              </div>
            )}

            <div className="flex items-start space-x-4">
              <span className="w-32 font-semibold">{t('teams')}:</span>
              <div className="flex flex-wrap gap-1">
                {profile.teams && profile.teams.length > 0 ? (
                  profile.teams.map((team) => (
                    <span
                      key={team.id}
                      className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-sm font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10"
                    >
                      {team.name}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-700">{t('notAvailable')}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  } catch (error) {
    if (error instanceof Error && error.message === 'User not found') {
      notFound();
    }
    throw error;
  }
} 