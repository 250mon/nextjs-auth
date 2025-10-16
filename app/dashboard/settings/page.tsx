import { lusitana } from "@/app/ui/fonts";
import { getUserSettings } from "@/app/actions/settings-actions";
import SettingsForm from "@/app/ui/settings/settings-form";
import { getCurrentLanguage, t } from "@/app/lib/i18n";

// Force dynamic rendering since we need to access user session
export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const userSettings = await getUserSettings();
  const currentLanguage = await getCurrentLanguage();

  return (
    <div className="w-full">
      <div className="flex w-full items-center justify-between">
        <h1 className={`${lusitana.className} text-2xl`}>{t('settings', currentLanguage)}</h1>
      </div>
      
      <div className="mt-4 md:mt-8">
        <div className="rounded-lg bg-gray-50 p-4 md:p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">{t('userPreferences', currentLanguage)}</h2>
            <p className="text-sm text-gray-600">
              {currentLanguage === 'ko' 
                ? '테이블에서 항목과 SKU가 표시되는 방식을 구성하고 언어 설정을 지정하세요.'
                : 'Configure how items and SKUs are displayed in tables, and set your language preferences.'
              }
            </p>
          </div>
          
          <SettingsForm initialSettings={userSettings} />
        </div>
      </div>
    </div>
  );
}
