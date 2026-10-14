"use client";

import { SearchCheck } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { ResetDemo } from "@/components/layout/reset-demo";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuBadge,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
    useSidebar,
} from "@/components/ui/sidebar";
import { APP_NAME, APP_TAGLINE, NAV_ITEMS, isNavActive } from "@/config/navigation";
import { useHealth, useInterventions } from "@/hooks/use-api";

export function AppSidebar() {
    const pathname = usePathname();
    const { isMobile, setOpenMobile } = useSidebar();
    const { data: pending } = useInterventions("pending_approval");
    const { data: health } = useHealth();
    const pendingCount = pending?.length ?? 0;

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            size="lg"
                            tooltip={APP_NAME}
                            render={<Link href="/dashboard" />}
                            onClick={() => isMobile && setOpenMobile(false)}
                        >
                            <span className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                                <SearchCheck className="size-4" aria-hidden />
                            </span>
                            <span className="grid flex-1 text-left leading-tight">
                                <span className="truncate text-sm font-semibold">{APP_NAME}</span>
                                <span className="truncate text-xs text-muted-foreground">{APP_TAGLINE}</span>
                            </span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Workspace</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
                                <SidebarMenuItem key={href}>
                                    <SidebarMenuButton
                                        tooltip={label}
                                        isActive={isNavActive(pathname, href)}
                                        render={
                                            <Link
                                                href={href}
                                                aria-current={isNavActive(pathname, href) ? "page" : undefined}
                                            />
                                        }
                                        onClick={() => isMobile && setOpenMobile(false)}
                                    >
                                        <Icon aria-hidden />
                                        <span>{label}</span>
                                    </SidebarMenuButton>
                                    {href === "/approvals" && pendingCount > 0 && (
                                        <SidebarMenuBadge aria-label={`${pendingCount} pending`}>
                                            {pendingCount}
                                        </SidebarMenuBadge>
                                    )}
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <ThemeToggle />
                    </SidebarMenuItem>
                    {health?.demoEndpoints === true && (
                        <SidebarMenuItem>
                            <ResetDemo />
                        </SidebarMenuItem>
                    )}
                </SidebarMenu>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}
