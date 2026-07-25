import { Button } from '@/app/ui/button';
import { changePasswordServer } from '@/app/actions/profile-actions';
import { getCurrentTranslations } from '@/app/lib/i18n';
import Link from 'next/link';

interface ChangePasswordFormProps {
  cancelHref?: string;
}

export default async function ChangePasswordForm({ cancelHref }: ChangePasswordFormProps) {
  const { t } = await getCurrentTranslations();

  return (
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
        {cancelHref && (
          <Link
            href={cancelHref}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            {t('cancel')}
          </Link>
        )}
      </div>
    </form>
  );
}
