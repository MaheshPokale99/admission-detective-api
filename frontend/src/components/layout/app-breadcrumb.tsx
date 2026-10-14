"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment } from "react";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { NAV_ITEMS } from "@/config/navigation";
import { useLead } from "@/hooks/use-api";

interface Crumb {
    label: string;
    href?: string;
}

function LeadCrumb({ id }: { id: string }) {
    const { data } = useLead(id);
    return (
        <BreadcrumbPage className="max-w-40 truncate sm:max-w-64">{data?.lead.name ?? "Lead details"}</BreadcrumbPage>
    );
}

export function AppBreadcrumb() {
    const pathname = usePathname();
    const [root, leadId] = pathname.split("/").filter(Boolean);
    const section = NAV_ITEMS.find((item) => item.href === `/${root ?? ""}`);

    const crumbs: Crumb[] = [];
    if (!section) crumbs.push({ label: "Not found" });
    else if (leadId && root === "leads") crumbs.push({ label: section.label, href: section.href });
    else crumbs.push({ label: section.label });

    return (
        <Breadcrumb className="min-w-0">
            <BreadcrumbList className="flex-nowrap">
                {crumbs.map((crumb, i) => {
                    const isLast = i === crumbs.length - 1 && !(leadId && root === "leads");
                    return (
                        <Fragment key={crumb.label}>
                            {i > 0 && <BreadcrumbSeparator />}
                            <BreadcrumbItem>
                                {isLast || !crumb.href ? (
                                    <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                                ) : (
                                    <BreadcrumbLink render={<Link href={crumb.href} />}>{crumb.label}</BreadcrumbLink>
                                )}
                            </BreadcrumbItem>
                        </Fragment>
                    );
                })}
                {leadId && root === "leads" && (
                    <>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <LeadCrumb id={leadId} />
                        </BreadcrumbItem>
                    </>
                )}
            </BreadcrumbList>
        </Breadcrumb>
    );
}
