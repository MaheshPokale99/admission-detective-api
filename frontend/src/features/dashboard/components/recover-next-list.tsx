"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { StatusBadge } from "@/components/common/status-badges";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "@/components/ui/item";
import { Skeleton } from "@/components/ui/skeleton";
import type { LeadSummary } from "@/lib/api";
import { STAGE_LABEL } from "@/lib/labels";
import { initials } from "@/lib/strings";

const LIMIT = 4;

export function RecoverNextList({ leads }: { leads: LeadSummary[] }) {
    const next = leads
        .filter((l) => l.status === "ready")
        .sort((a, b) => b.recoveryScore - a.recoveryScore)
        .slice(0, LIMIT);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Sparkles className="size-4 text-primary" aria-hidden />
                    Recover these next
                </CardTitle>
                <CardDescription>Highest recovery potential among contactable stalled leads</CardDescription>
                <CardAction>
                    <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/leads" />}>
                        All leads <ArrowRight data-icon="inline-end" />
                    </Button>
                </CardAction>
            </CardHeader>
            <CardContent>
                {next.length === 0 ? (
                    <Empty className="border">
                        <EmptyHeader>
                            <EmptyMedia variant="icon">
                                <Sparkles />
                            </EmptyMedia>
                            <EmptyTitle>No contactable stalled leads</EmptyTitle>
                            <EmptyDescription>
                                Leads that stall and are safe to contact will be ranked here.
                            </EmptyDescription>
                        </EmptyHeader>
                    </Empty>
                ) : (
                    <ul className="flex flex-col gap-1">
                        {next.map((l) => (
                            <li key={l.id}>
                                <Item render={<Link href={`/leads/${l.id}`} />}>
                                    <ItemMedia>
                                        <Avatar>
                                            <AvatarFallback>{initials(l.name)}</AvatarFallback>
                                        </Avatar>
                                    </ItemMedia>
                                    <ItemContent>
                                        <ItemTitle>{l.name}</ItemTitle>
                                        <ItemDescription className="line-clamp-1">
                                            {STAGE_LABEL[l.stage]} · silent for {l.daysInactive} days · {l.counsellor}
                                        </ItemDescription>
                                    </ItemContent>
                                    <ItemActions>
                                        <span className="hidden sm:inline-flex">
                                            <StatusBadge status={l.status} />
                                        </span>
                                        <span className="text-sm text-muted-foreground tabular-nums">
                                            <span className="sr-only">Recovery score </span>
                                            {l.recoveryScore}/100
                                        </span>
                                        <ArrowRight className="size-4 text-muted-foreground" aria-hidden />
                                    </ItemActions>
                                </Item>
                            </li>
                        ))}
                    </ul>
                )}
            </CardContent>
        </Card>
    );
}

export function RecoverNextSkeleton() {
    return (
        <Card aria-hidden>
            <CardHeader>
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-72 max-w-full" />
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
                {Array.from({ length: LIMIT }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                        <Skeleton className="size-8 rounded-full" />
                        <div className="flex-1 space-y-1.5">
                            <Skeleton className="h-4 w-40" />
                            <Skeleton className="h-3 w-64 max-w-full" />
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
