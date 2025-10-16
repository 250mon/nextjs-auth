import { lusitana } from "@/app/ui/fonts";
import { getCurrentTranslations } from "@/app/lib/i18n";

export default async function Page() {
  const { t } = await getCurrentTranslations();

  return (
    <main>
      <h1 className={`${lusitana.className} mb-4 text-xl md:text-2xl`}>
        {t('authenticationDashboard')}
      </h1>
      <p>Welcome to the authentication dashboard</p>
    </main>
  );
}