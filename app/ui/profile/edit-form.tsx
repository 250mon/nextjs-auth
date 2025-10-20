import { Button } from '@/app/ui/button';
import { updateProfileServer, changePasswordServer } from '@/app/actions/profile-actions';
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('teams')}
            </label>
            <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 min-h-[42px] flex flex-wrap gap-1 items-center">
              {user.teams && user.teams.length > 0 ? (
                user.teams.map((team) => (
                  <span
                    key={team.id}
                    className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10"
                  >
                    {team.name}
                  </span>
                ))
              ) : (
                <span className="text-sm text-gray-500">No teams assigned</span>
              )}
            </div>
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
              href={`/profile/${user.slug}`}
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
        
        <form action={changePasswordServer} className="space-y-4">
          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
              {t('currentPassword')}
            </label>
            <input
              id="currentPassword"
              name="currentPassword"
              type="password"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
              {t('newPassword')}
            </label>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              required
              minLength={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              {t('confirmPassword')}
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              minLength={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="submit"
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {t('changePassword')}
            </Button>
            <Link
              href={`/profile/${user.slug}`}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              {t('cancel')}
            </Link>
          </div>
        </form>
      </div>

      {/* Back to Profile Link */}
      <div className="flex justify-center pt-4 border-t">
        <Link
          href={`/profile/${user.slug}`}
          className="text-blue-600 hover:text-blue-800 font-medium"
        > 
          ← {t('backToProfile')}
        </Link>
      </div>
    </div>
  );
}
