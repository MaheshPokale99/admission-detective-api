"use client";

import { ArrowUpRight, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Item, Stagger } from "@/components/common/motion";
import { EmptyState, ErrorState, PageHeader } from "@/components/common/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useInterventions } from "@/hooks/use-api";
import { timeAgo } from "@/lib/time";
import { ApprovalCard } from "./components/approval-card";

const HEADER = {
    title: "Approval queue",
    description:
        "Every drafted message waits here. Edit it, approve it, or reject it. Only approved text is ever sent.",
};

const GRID = "grid max-w-3xl gap-6";

export function ApprovalsPage() {
    const { data: interventions, isLoading, error, refetch } = useInterventions();
    const data = interventions?.filter((i) => i.status === "pending_approval" || i.status === "failed");

    if (error) {
        return (
            <>
                <PageHeader {...HEADER} />
                <ErrorState
                    title="Could not load the approval queue"
                    message={error.message}
                    onRetry={() => void refetch()}
                />
            </>
        );
    }

    if (isLoading || !data) {
        return (
            <>
                <PageHeader {...HEADER} />
                <div className={GRID} aria-busy="true" aria-label="Loading approval queue">
                    {Array.from({ length: 2 }).map((_, i) => (
                        <ApprovalCardSkeleton key={i} />
                    ))}
                </div>
            </>
        );
    }

    if (data.length === 0) {
        return (
            <>
                <PageHeader {...HEADER} />
                <EmptyState
                    icon={ShieldCheck}
                    title="Nothing waiting for approval"
                    description="Investigate a lead from the Lead Radar and its drafted follow-up will appear here."
                    action={
                        <Button variant="outline" nativeButton={false} render={<Link href="/leads" />}>
                            Open Lead Radar
                        </Button>
                    }
                />
            </>
        );
    }

    return (
        <>
            <PageHeader
                {...HEADER}
                actions={
                    <Badge variant="secondary" aria-live="polite">
                        {data.length} to review
                    </Badge>
                }
            />
            <Stagger className={GRID}>
                {data.map((iv) => (
                    <Item key={iv.id} className="flex h-full flex-col gap-2">
                        <div className="flex items-center justify-between gap-3 px-1 text-sm">
                            <Link
                                href={`/leads/${iv.leadId}`}
                                className="flex min-w-0 items-center gap-1 rounded-sm font-medium outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
                            >
                                <span className="truncate">{iv.lead?.name ?? "Lead"}</span>
                                <ArrowUpRight className="size-3.5 shrink-0" aria-hidden />
                            </Link>
                            <span className="shrink-0 text-xs text-muted-foreground">
                                drafted {timeAgo(iv.createdAt)}
                            </span>
                        </div>
                        <div className="flex-1">
                            <ApprovalCard
                                intervention={iv}
                                leadName={iv.lead?.name ?? "Lead"}
                                leadEmail={iv.lead?.email ?? ""}
                                reviewer={iv.lead?.counsellor ?? "Counsellor"}
                            />
                        </div>
                    </Item>
                ))}
            </Stagger>
        </>
    );
}

function ApprovalCardSkeleton() {
    return (
        <Card aria-hidden>
            <CardHeader>
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-72 max-w-full" />
            </CardHeader>
            <CardContent className="space-y-4">
                <Skeleton className="h-4 w-56" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-48 w-full" />
            </CardContent>
            <CardFooter className="justify-end gap-2">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-32" />
            </CardFooter>
        </Card>
    );
}
