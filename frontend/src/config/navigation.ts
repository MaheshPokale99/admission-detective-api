import { LayoutDashboard, Radar, ScrollText, ShieldCheck, type LucideIcon } from "lucide-react";

export interface NavItem {
    href: string;
    label: string;
    icon: LucideIcon;
}

export const APP_NAME = "Drop-Off Detective";
export const APP_TAGLINE = "NIAT admissions";

export const NAV_ITEMS: readonly NavItem[] = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/leads", label: "Lead Radar", icon: Radar },
    { href: "/approvals", label: "Approvals", icon: ShieldCheck },
    { href: "/log", label: "Recovery Log", icon: ScrollText },
];

export const isNavActive = (pathname: string, href: string) => pathname === href || pathname.startsWith(`${href}/`);
