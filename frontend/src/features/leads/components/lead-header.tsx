"use client";

import { ArrowLeft, Clock, Mail, MapPin, Phone, UserRound, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { StageBadge, StatusBadge } from "@/components/common/status-badges";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { LeadSummary } from "@/lib/api";
import { initials } from "@/lib/strings";
import { InvestigateButton } from "./investigate-button";

interface LeadHeaderProps {
    lead: LeadSummary;
    isRunning: boolean;
    isReinvestigation: boolean;
    disabledReason: string | null;
    onRun: () => void;
}

export function LeadHeader({ lead, isRunning, isReinvestigation, disabledReason, onRun }: LeadHeaderProps) {
    const meta: { icon: LucideIcon; label: string; href?: string }[] = [
        { icon: UserRound, label: `Counsellor: ${lead.counsellor}` },
        { icon: Mail, label: lead.email, href: `mailto:${lead.email}` },
        ...(lead.phone ? [{ icon: Phone, label: lead.phone, href: `tel:${lead.phone}` }] : []),
        ...(lead.city ? [{ icon: MapPin, label: lead.city }] : []),
    ];

    return (
        <div className="space-y-3">
            <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/leads" />} className="-ml-2.5">
                <ArrowLeft />
                Lead Radar
            </Button>
            <Card>
                <CardContent className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex min-w-0 items-start gap-4">
                        <Avatar size="lg" className="size-12">
                            <AvatarFallback className="text-base">{initials(lead.name)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 space-y-2">
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                                <h1 className="text-xl font-semibold tracking-tight">{lead.name}</h1>
                                <StageBadge stage={lead.stage} />
                                <StatusBadge status={lead.status} />
                            </div>
                            <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                <li className="flex items-center gap-1.5">
                                    <Clock className="size-3.5" aria-hidden />
                                    <span className="tabular-nums">Silent for {lead.daysInactive} days</span>
                                </li>
                                {meta.map(({ icon: Icon, label, href }) => (
                                    <li key={label} className="flex min-w-0 items-center gap-1.5">
                                        <Icon className="size-3.5 shrink-0" aria-hidden />
                                        {href ? (
                                            <a href={href} className="truncate hover:text-foreground hover:underline">
                                                {label}
                                            </a>
                                        ) : (
                                            <span className="truncate">{label}</span>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                    <InvestigateButton
                        isRunning={isRunning}
                        isReinvestigation={isReinvestigation}
                        disabledReason={disabledReason}
                        onRun={onRun}
                    />
                </CardContent>
            </Card>
        </div>
    );
}

export function LeadHeaderSkeleton() {
    return (
        <div className="space-y-3" aria-busy aria-label="Loading lead">
            <Skeleton className="h-7 w-28" />
            <Card>
                <CardContent className="flex items-center gap-4">
                    <Skeleton className="size-12 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-6 w-56" />
                        <Skeleton className="h-4 w-80 max-w-full" />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
