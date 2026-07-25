import { Button } from '@/app/ui/button';
import { updateProfileServer } from '@/app/actions/profile-actions';
import ChangePasswordForm from '@/app/ui/profile/change-password-form';
import type { User } from '@/app/lib/definitions';
import { getCurrentTranslations } from '@/app/lib/i18n';
import Link from 'next/link';

interface EditProfileFormProps {
  user: User;
}

export default async function EditProfileForm({ user }: EditProfileFormProps) {
  const { t } = await getCurrentTranslations();

  return (
    <div className="space-y-8">
      {/* Profile Information Form */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('profileInformation')}</h3>
        
        <form action={updateProfileServer} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              {t('name')}
            </label>
            <input
              id="name"
              name="name"
              type="text"
              defaultValue={user.name}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          { user.isadmin && (
            <div>
              <label htmlFor="isadmin" className="flex items-center space-x-2">
                <input
                  id="isadmin"
                  name="isadmin"
                  type="checkbox"
                  disabled={!user.isadmin}
                  defaultChecked={user.isadmin}
                  value="true"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm font-medium text-gray-700">{t('isAdmin')}</span>
              </label>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {t('update')}
            </Button>
            <Link
              href={`/dashboard/profile/${user.slug}`}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              {t('cancel')}
            </Link>
          </div>
        </form>
      </div>

      {/* Change Password Form */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('changePassword')}</h3>

        <ChangePasswordForm cancelHref={`/dashboard/profile/${user.slug}`} />
      </div>

      {/* Back to Profile Link */}
      <div className="flex justify-center pt-4 border-t">
        <Link
          href={`/dashboard/profile/${user.slug}`}
          className="text-blue-600 hover:text-blue-800 font-medium"
        > 
          ← {t('backToProfile')}
        </Link>
      </div>
    </div>
  );
}
