"use client";

import { CircleAlert, Clock, GraduationCap, Mail, UserCheck, type LucideIcon } from "lucide-react";
import { CountUp, Item, Stagger } from "@/components/common/motion";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Metrics } from "@/lib/api";

interface Kpi {
    label: string;
    value: number;
    hint: string;
    icon: LucideIcon;
}

const GRID = "grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5";

function buildKpis({ totals, rates }: Metrics): Kpi[] {
    return [
        {
            label: "Stalled leads",
            value: totals.stalled,
            hint: `${totals.readyToInvestigate} ready to investigate`,
            icon: CircleAlert,
        },
        {
            label: "Awaiting approval",
            value: totals.awaitingApproval,
            hint: "Nothing is sent without a counsellor",
            icon: Clock,
        },
        {
            label: "Messages sent",
            value: totals.sent,
            hint: `${rates.approvalRate}% of drafts approved`,
            icon: Mail,
        },
        {
            label: "Leads recovered",
            value: totals.recovered,
            hint: `${rates.recoveryRate}% of messages brought a lead back`,
            icon: UserCheck,
        },
        {
            label: "Admitted",
            value: totals.admitted,
            hint: `${rates.admissionRate}% of messages ended in admission`,
            icon: GraduationCap,
        },
    ];
}

/** Top row of headline numbers. */
export function KpiCards({ metrics }: { metrics: Metrics }) {
    return (
        <Stagger className={GRID}>
            {buildKpis(metrics).map(({ label, value, hint, icon: Icon }) => (
                <Item key={label} className="h-full">
                    <Card className="h-full">
                        <CardHeader>
                            <CardDescription>{label}</CardDescription>
                            <CardTitle className="text-3xl font-semibold tabular-nums">
                                <CountUp value={value} />
                            </CardTitle>
                            <CardAction>
                                <Icon className="size-4 text-muted-foreground" aria-hidden />
                            </CardAction>
                        </CardHeader>
                        <CardContent className="text-xs text-muted-foreground">{hint}</CardContent>
                    </Card>
                </Item>
            ))}
        </Stagger>
    );
}

export function KpiCardsSkeleton() {
    return (
        <div className={GRID} aria-hidden>
            {Array.from({ length: 5 }).map((_, i) => (
                <Card key={i}>
                    <CardHeader>
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="mt-1 h-8 w-16" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-3 w-full" />
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
