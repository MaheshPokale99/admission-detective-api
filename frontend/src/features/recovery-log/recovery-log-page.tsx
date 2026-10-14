"use client";

import { ListFilter, ScrollText } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { EmptyState, ErrorState, PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useInterventions } from "@/hooks/use-api";
import type { Intervention } from "@/lib/api";
import { RecoveryLogTable, RecoveryLogTableSkeleton } from "./components/recovery-log-table";

type Filter = "all" | "sent" | "rejected" | "failed";

const HEADER = {
    title: "Recovery log",
    description: "Every reviewed intervention, what the counsellor decided, and what the student did next.",
};

const FILTERS: { value: Filter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "sent", label: "Sent" },
    { value: "rejected", label: "Rejected" },
    { value: "failed", label: "Failed" },
];

const matches = (status: Intervention["status"], filter: Filter) =>
    filter === "all" || status === filter || (filter === "sent" && status === "approved");

export function RecoveryLogPage() {
    const { data, isLoading, error, refetch } = useInterventions();
    const [filter, setFilter] = useState<Filter>("all");

    const reviewed = useMemo(() => (data ?? []).filter((i) => i.status !== "pending_approval"), [data]);
    const rows = useMemo(() => reviewed.filter((i) => matches(i.status, filter)), [reviewed, filter]);
    const count = (f: Filter) => reviewed.filter((i) => matches(i.status, f)).length;

    if (error) {
        return (
            <>
                <PageHeader {...HEADER} />
                <ErrorState
                    title="Could not load the recovery log"
                    message={error.message}
                    onRetry={() => void refetch()}
                />
            </>
        );
    }

    if (!isLoading && reviewed.length === 0) {
        return (
            <>
                <PageHeader {...HEADER} />
                <EmptyState
                    icon={ScrollText}
                    title="No interventions yet"
                    description="Approved and rejected drafts will be logged here, together with what happened next."
                    action={
                        <Button variant="outline" nativeButton={false} render={<Link href="/approvals" />}>
                            Open approval queue
                        </Button>
                    }
                />
            </>
        );
    }

    return (
        <>
            <PageHeader {...HEADER} />
            <Card>
                <CardHeader>
                    <CardTitle>Interventions</CardTitle>
                    <CardDescription>
                        {isLoading
                            ? "Loading interventions"
                            : `${rows.length} of ${reviewed.length} reviewed ${reviewed.length === 1 ? "intervention" : "interventions"}`}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ToggleGroup
                        variant="outline"
                        size="sm"
                        spacing={0}
                        aria-label="Filter by decision"
                        value={[filter]}
                        onValueChange={(v) => v[0] && setFilter(v[0] as Filter)}
                        disabled={isLoading}
                    >
                        {FILTERS.map(({ value, label }) => (
                            <ToggleGroupItem key={value} value={value}>
                                {label}
                                {!isLoading && (
                                    <span className="text-xs text-muted-foreground tabular-nums">{count(value)}</span>
                                )}
                            </ToggleGroupItem>
                        ))}
                    </ToggleGroup>
                </CardContent>
                <CardContent className="px-0">
                    {isLoading ? (
                        <RecoveryLogTableSkeleton />
                    ) : rows.length === 0 ? (
                        <div className="px-(--card-spacing)">
                            <Empty className="border">
                                <EmptyHeader>
                                    <EmptyMedia variant="icon">
                                        <ListFilter />
                                    </EmptyMedia>
                                    <EmptyTitle>No {filter} interventions</EmptyTitle>
                                    <EmptyDescription>Try a different filter to see other decisions.</EmptyDescription>
                                </EmptyHeader>
                                <Button variant="outline" size="sm" onClick={() => setFilter("all")}>
                                    Show all
                                </Button>
                            </Empty>
                        </div>
                    ) : (
                        <RecoveryLogTable rows={rows} />
                    )}
                </CardContent>
            </Card>
        </>
    );
}
