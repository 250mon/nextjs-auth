"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import cslx from "clsx";
import {
    Cog6ToothIcon,
    HomeIcon,
    UserIcon,
    ShieldCheckIcon,
} from "@heroicons/react/24/outline";

// Comprehensive icon map for all possible navigation items
const iconMap = {
    home: HomeIcon,
    settings: Cog6ToothIcon,
    profile: UserIcon,
    admin: ShieldCheckIcon,
} as const;

export type IconName = keyof typeof iconMap;

export interface LinkItem {
    name: string;
    href: string;
    iconName: IconName;
}

interface ClientNavLinksProps {
    links: LinkItem[];
    variant?: 'dashboard' | 'profile';
}

export default function ClientNavLinks({ links, variant = 'dashboard' }: ClientNavLinksProps) {
    const pathname = usePathname();

    // Different styling based on variant
    const baseClasses = "flex h-[48px] items-center gap-2 rounded-md bg-gray-50 p-3 text-sm font-medium hover:bg-sky-100 hover:text-blue-600";
    const variantClasses = {
        dashboard: "w-full md:p-2 md:px-3",
        profile: "grow justify-center md:flex-none md:justify-start md:p-2 md:px-3"
    };

    const textClasses = {
        dashboard: "block",
        profile: "hidden md:block"
    };

    return (
        <>
            {links.map((link) => {
                const LinkIcon = iconMap[link.iconName];
                return (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={cslx(
                            baseClasses,
                            variantClasses[variant],
                            {
                                "bg-sky-100 text-blue-600": pathname === link.href,
                            }
                        )}
                    >
                        <LinkIcon className="w-6" />
                        <p className={textClasses[variant]}>{link.name}</p>
                    </Link>
                );
            })}
        </>
    );
}
