import { getProfileDTO } from "@/app/lib/dto";
import { auth } from "@/auth.config";
import { notFound, redirect } from "next/navigation";
import { getCurrentTranslations } from "@/app/lib/i18n";
import { getCurrentUser } from "@/app/lib/dal";
import EditProfileForm from "@/app/ui/profile/edit-form";
import Breadcrumbs from "@/app/ui/breadcrumbs";
import { ShieldCheckIcon } from "@heroicons/react/24/outline";

interface PageProps {
  params: Promise<{slug: string}>;
}

export default async function EditProfilePage({ params }: PageProps) {
  try {
    const { slug } = await params;
    const profile = await getProfileDTO(slug);
    
    // Get current session and user to check permissions
    const session = await auth();
    const currentUser = await getCurrentUser();
    const isOwnProfile = session?.user?.id === profile.id;
    const isAdmin = currentUser?.isadmin || false;
    
    // Allow users to edit their own profile OR admins to edit any profile
    if (!isOwnProfile && !isAdmin) {
      redirect(`/dashboard/profile/${slug}`);
    }

    const { t } = await getCurrentTranslations();

    return (
      <main className="flex min-h-screen flex-col items-center p-6 md:p-24">
        <div className="w-full max-w-4xl">
          <Breadcrumbs
            breadcrumbs={[
              { label: t('profile'), href: `/dashboard/profile/${slug}` },
              {
                label: t('editProfile'),
                href: `/dashboard/profile/${slug}/edit`,
                active: true,
              },
            ]}
          />
          
          <div className="rounded-lg bg-white p-6 shadow-md mt-4">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">
                {isAdmin && !isOwnProfile ? t('editAsAdmin') : t('editProfile')}
              </h1>
              {isAdmin && !isOwnProfile && (
                <div className="flex items-center gap-2 px-3 py-1 bg-red-100 text-red-800 text-sm rounded-md">
                  <ShieldCheckIcon className="w-4 h-4" />
                  Admin Mode
                </div>
              )}
            </div>
            
            <EditProfileForm user={profile} />
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
