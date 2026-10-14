"use client";

import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import type { Metrics } from "@/lib/api";
import { STAGE_LABEL } from "@/lib/labels";

const config = { count: { label: "Leads", color: "var(--chart-1)" } } satisfies ChartConfig;

export function AdmissionFunnelChart({ funnel }: { funnel: Metrics["funnel"] }) {
    const data = funnel.map((f) => ({ name: STAGE_LABEL[f.stage], count: f.count }));

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle>Admission funnel</CardTitle>
                <CardDescription>Where every lead currently sits</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer
                    config={config}
                    className="aspect-auto h-64 w-full"
                    role="img"
                    aria-label={`Leads per stage: ${data.map((d) => `${d.name} ${d.count}`).join(", ")}`}
                >
                    <BarChart accessibilityLayer data={data} layout="vertical" margin={{ left: 0, right: 32 }}>
                        <CartesianGrid horizontal={false} />
                        <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} width={88} />
                        <XAxis type="number" hide />
                        <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                        <Bar dataKey="count" fill="var(--color-count)" radius={6}>
                            <LabelList dataKey="count" position="right" offset={8} className="fill-foreground" />
                        </Bar>
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}

export function ChartCardSkeleton() {
    return (
        <Card className="h-full" aria-hidden>
            <CardHeader>
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-56" />
            </CardHeader>
            <CardContent>
                <Skeleton className="h-64 w-full" />
            </CardContent>
        </Card>
    );
}
