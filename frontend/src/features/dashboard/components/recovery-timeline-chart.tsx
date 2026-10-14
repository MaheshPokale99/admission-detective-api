"use client";

import { TrendingUp } from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import type { Metrics } from "@/lib/api";

const config = {
    sent: { label: "Messages sent", color: "var(--chart-1)" },
    recovered: { label: "Leads recovered", color: "var(--chart-2)" },
} satisfies ChartConfig;

const shortDate = (iso: string) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

export function RecoveryTimelineChart({ timeline }: { timeline: Metrics["timeline"] }) {
    const data = timeline.map((t) => ({ ...t, day: shortDate(t.date) }));
    const hasActivity = timeline.some((t) => t.sent > 0 || t.recovered > 0);

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle>Recovery over the last 14 days</CardTitle>
                <CardDescription>Approved messages sent vs. leads who came back</CardDescription>
            </CardHeader>
            <CardContent>
                {hasActivity ? (
                    <ChartContainer
                        config={config}
                        className="aspect-auto h-64 w-full"
                        role="img"
                        aria-label="Area chart of messages sent and leads recovered per day over the last 14 days"
                    >
                        <AreaChart accessibilityLayer data={data} margin={{ left: 0, right: 8, top: 8 }}>
                            <CartesianGrid vertical={false} />
                            <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} />
                            <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} />
                            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                            <Area
                                dataKey="sent"
                                type="monotone"
                                fill="var(--color-sent)"
                                fillOpacity={0.2}
                                stroke="var(--color-sent)"
                                strokeWidth={2}
                            />
                            <Area
                                dataKey="recovered"
                                type="monotone"
                                fill="var(--color-recovered)"
                                fillOpacity={0.3}
                                stroke="var(--color-recovered)"
                                strokeWidth={2}
                            />
                            <ChartLegend content={<ChartLegendContent />} />
                        </AreaChart>
                    </ChartContainer>
                ) : (
                    <Empty className="h-64 border">
                        <EmptyHeader>
                            <EmptyMedia variant="icon">
                                <TrendingUp />
                            </EmptyMedia>
                            <EmptyTitle>No recovery activity yet</EmptyTitle>
                            <EmptyDescription>
                                Approved messages and recovered leads from the last 14 days will be charted here.
                            </EmptyDescription>
                        </EmptyHeader>
                    </Empty>
                )}
            </CardContent>
        </Card>
    );
}
