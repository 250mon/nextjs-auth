import { User } from "@/app/lib/definitions";
import { getCurrentTranslations } from "@/app/lib/i18n";
import ClientNavLinks, { type IconName } from "@/app/ui/dashboard/client-nav-links";

interface NavLinksProps {
    user: User | null;
}

// Map icon names to avoid passing functions to client
const getLinks = (user: User | null, t: (key: keyof typeof import('@/app/lib/i18n').translations.en) => string) => {
    // If no user, return empty array (no navigation)
    if (!user) {
        return [];
    }

    const baseLinks: Array<{ name: string; href: string; iconName: IconName }> = [
        { name: t('home'), href: "/dashboard", iconName: "home" },
        { name: t('settings'), href: "/dashboard/settings", iconName: "settings" },
        { name: t('profile'), href: "/dashboard/profile", iconName: "profile" },
    ];

    // Add admin link if user is admin
    if (user.isadmin) {
        baseLinks.push({ name: t('admin'), href: "/dashboard/admin", iconName: "admin" });
    }

    return baseLinks;
};

export default async function NavLinks({ user }: NavLinksProps) {
    const { t } = await getCurrentTranslations();
    const links = getLinks(user, t);

    // Pass translated links with icon names (not functions) to client component
    return <ClientNavLinks links={links} variant="dashboard" />;
}
