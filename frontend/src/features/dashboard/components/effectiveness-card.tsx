"use client";

import { FlaskConical } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Progress } from "@/components/ui/progress";
import type { Bucket } from "@/lib/api";
import { labelFor } from "@/lib/labels";

const MIN_SAMPLE = 5;

interface Props {
    title: string;
    description: string;
    buckets: Bucket[];
    labels: Record<string, string>;
}

/** Recovery rate per bucket, flagging rates based on very few sent messages. */
export function EffectivenessCard({ title, description, buckets, labels }: Props) {
    const sorted = [...buckets].sort((a, b) => b.recoveryRate - a.recoveryRate || b.sent - a.sent);

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col">
                {sorted.length === 0 ? (
                    <Empty className="flex-1 border">
                        <EmptyHeader>
                            <EmptyMedia variant="icon">
                                <FlaskConical />
                            </EmptyMedia>
                            <EmptyTitle>Nothing to compare yet</EmptyTitle>
                            <EmptyDescription>Results appear once approved messages have been sent.</EmptyDescription>
                        </EmptyHeader>
                    </Empty>
                ) : (
                    <ul className="space-y-4">
                        {sorted.map((b) => (
                            <li key={b.key} className="space-y-2">
                                <div className="flex items-center justify-between gap-3 text-sm">
                                    <span className="min-w-0 truncate font-medium">{labelFor(labels, b.key)}</span>
                                    <span className="shrink-0 text-muted-foreground tabular-nums">
                                        {b.recovered}/{b.sent} ·{" "}
                                        <span className="font-medium text-foreground">{b.recoveryRate}%</span>
                                    </span>
                                </div>
                                <Progress
                                    value={b.recoveryRate}
                                    aria-label={`${labelFor(labels, b.key)} recovery rate`}
                                />
                            </li>
                        ))}
                    </ul>
                )}
                {sorted.some((b) => b.sent < MIN_SAMPLE) && (
                    <p className="mt-auto pt-4 text-xs text-muted-foreground">
                        Some rates rest on fewer than {MIN_SAMPLE} messages, so treat them as early signals.
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
