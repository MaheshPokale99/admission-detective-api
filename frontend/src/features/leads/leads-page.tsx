"use client";

import { MotionConfig } from "framer-motion";
import { RefreshCw, SearchX } from "lucide-react";
import { useMemo, useState } from "react";
import { EmptyState, ErrorState, PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { useLeads } from "@/hooks/use-api";
import { cn } from "@/lib/utils";
import { LeadFilters } from "./components/lead-filters";
import { LeadRadarSkeleton, LeadRadarTable } from "./components/lead-radar-table";
import { byPotential, LEAD_FILTERS, matchesFilter, matchesQuery, type LeadFilterId } from "./lib/filters";

export function LeadsPage() {
    const { data: leads, isPending, isFetching, error, refetch } = useLeads();
    const [filter, setFilter] = useState<LeadFilterId>("ready");
    const [query, setQuery] = useState("");

    const counts = useMemo(() => {
        if (!leads) return null;
        return Object.fromEntries(
            LEAD_FILTERS.map((f) => [f.id, leads.filter((l) => matchesFilter(l, f.id)).length]),
        ) as Record<LeadFilterId, number>;
    }, [leads]);

    const rows = useMemo(
        () => (leads ?? []).filter((l) => matchesFilter(l, filter) && matchesQuery(l, query)).sort(byPotential),
        [leads, filter, query],
    );

    const reset = () => {
        setQuery("");
        setFilter("all");
    };

    return (
        <MotionConfig reducedMotion="user">
            <div className="space-y-6">
                <PageHeader
                    title="Lead Radar"
                    description="Stalled admission leads ranked by how recoverable they are. Opted-out, ineligible and unconsented leads are shown but locked."
                    actions={
                        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
                            <RefreshCw className={cn(isFetching && "animate-spin")} />
                            Refresh
                        </Button>
                    }
                />

                <LeadFilters
                    filter={filter}
                    onFilterChange={setFilter}
                    counts={counts}
                    query={query}
                    onQueryChange={setQuery}
                />

                {error ? (
                    <ErrorState title="Could not load leads" message={error.message} onRetry={() => refetch()} />
                ) : isPending ? (
                    <LeadRadarSkeleton />
                ) : rows.length === 0 ? (
                    <EmptyState
                        icon={SearchX}
                        title="No leads match"
                        description={
                            query
                                ? `Nothing matches "${query}" in this view. Try another filter or clear the search.`
                                : "There are no leads in this view yet."
                        }
                        action={
                            query || filter !== "all" ? (
                                <Button variant="outline" size="sm" onClick={reset}>
                                    Show all leads
                                </Button>
                            ) : undefined
                        }
                    />
                ) : (
                    <LeadRadarTable leads={rows} total={leads?.length ?? rows.length} />
                )}
            </div>
        </MotionConfig>
    );
}
