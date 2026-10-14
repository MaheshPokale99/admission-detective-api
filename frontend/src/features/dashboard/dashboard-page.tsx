"use client";

import { ArrowRight, Users } from "lucide-react";
import Link from "next/link";
import { Item, Stagger } from "@/components/common/motion";
import { EmptyState, ErrorState, PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { useLeads, useMetrics } from "@/hooks/use-api";
import { ACTION_LABEL, REASON_LABEL } from "@/lib/labels";
import { AdmissionFunnelChart, ChartCardSkeleton } from "./components/admission-funnel-chart";
import { EffectivenessCard } from "./components/effectiveness-card";
import { KpiCards, KpiCardsSkeleton } from "./components/kpi-cards";
import { RecoverNextList, RecoverNextSkeleton } from "./components/recover-next-list";
import { RecoveryTimelineChart } from "./components/recovery-timeline-chart";
import { SafetyCard } from "./components/safety-card";

const HEADER = {
    title: "Conversion intelligence",
    description: "How many stalled students there are, how many came back, and which follow-ups actually work.",
};

export function DashboardPage() {
    const metrics = useMetrics();
    const leads = useLeads();
    const m = metrics.data;

    const actions = (
        <Button nativeButton={false} render={<Link href="/leads" />}>
            Open Lead Radar <ArrowRight data-icon="inline-end" />
        </Button>
    );

    if (metrics.error) {
        return (
            <>
                <PageHeader {...HEADER} />
                <ErrorState
                    title="Could not load the dashboard"
                    message={metrics.error.message}
                    onRetry={() => void metrics.refetch()}
                />
            </>
        );
    }

    if (!m) {
        return (
            <>
                <PageHeader {...HEADER} actions={actions} />
                <div className="space-y-4" aria-busy="true" aria-label="Loading dashboard">
                    <KpiCardsSkeleton />
                    <div className="grid gap-4 lg:grid-cols-5">
                        <div className="lg:col-span-2">
                            <ChartCardSkeleton />
                        </div>
                        <div className="lg:col-span-3">
                            <ChartCardSkeleton />
                        </div>
                    </div>
                    <div className="grid gap-4 lg:grid-cols-3">
                        <ChartCardSkeleton />
                        <ChartCardSkeleton />
                        <ChartCardSkeleton />
                    </div>
                    <RecoverNextSkeleton />
                </div>
            </>
        );
    }

    if (m.totals.leads === 0) {
        return (
            <>
                <PageHeader {...HEADER} />
                <EmptyState
                    icon={Users}
                    title="No leads to analyse yet"
                    description="Once leads are imported, stalled admissions and recovery results will show up here."
                    action={actions}
                />
            </>
        );
    }

    return (
        <>
            <PageHeader {...HEADER} actions={actions} />
            <div className="space-y-4">
                <KpiCards metrics={m} />

                <Stagger className="grid gap-4 lg:grid-cols-5">
                    <Item className="h-full lg:col-span-2">
                        <AdmissionFunnelChart funnel={m.funnel} />
                    </Item>
                    <Item className="h-full lg:col-span-3">
                        <RecoveryTimelineChart timeline={m.timeline} />
                    </Item>
                </Stagger>

                <Stagger className="grid gap-4 lg:grid-cols-3">
                    <Item className="h-full">
                        <EffectivenessCard
                            title="What works: by action"
                            description="Recovery rate per type of message"
                            buckets={m.byAction}
                            labels={ACTION_LABEL}
                        />
                    </Item>
                    <Item className="h-full">
                        <EffectivenessCard
                            title="What works: by reason"
                            description="Recovery rate per confirmed drop-off reason"
                            buckets={m.byReason}
                            labels={REASON_LABEL}
                        />
                    </Item>
                    <Item className="h-full">
                        <SafetyCard safety={m.safety} rates={m.rates} />
                    </Item>
                </Stagger>

                {leads.isLoading ? (
                    <RecoverNextSkeleton />
                ) : leads.error ? (
                    <ErrorState
                        title="Could not load recommended leads"
                        message={leads.error.message}
                        onRetry={() => void leads.refetch()}
                    />
                ) : (
                    <RecoverNextList leads={leads.data ?? []} />
                )}
            </div>
        </>
    );
}
