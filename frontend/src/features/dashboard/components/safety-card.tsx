"use client";

import { BadgeCheck, ShieldCheck, UserPen } from "lucide-react";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { Metrics } from "@/lib/api";

export function SafetyCard({ safety, rates }: Pick<Metrics, "safety" | "rates">) {
    const reasons = Object.entries(safety.byReason);

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle>Safety and control</CardTitle>
                <CardDescription>Guardrails that protect students and keep humans in charge</CardDescription>
                <CardAction>
                    <ShieldCheck className="size-4 text-muted-foreground" aria-hidden />
                </CardAction>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <p className="text-3xl font-semibold tabular-nums">{safety.protectedStalled}</p>
                    <p className="text-sm text-muted-foreground">stalled leads protected from outreach</p>
                    {reasons.length > 0 && (
                        <ul className="mt-3 space-y-1.5 text-sm">
                            {reasons.map(([reason, n]) => (
                                <li key={reason} className="flex items-baseline justify-between gap-3">
                                    <span className="text-muted-foreground">{reason}</span>
                                    <span className="font-medium tabular-nums">{n}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <Separator />
                <dl className="grid grid-cols-2 gap-3">
                    <div>
                        <dt className="text-xs text-muted-foreground">Drafts approved</dt>
                        <dd className="mt-1 flex items-center gap-1.5 text-xl font-semibold tabular-nums">
                            <BadgeCheck className="size-4 text-muted-foreground" aria-hidden />
                            {rates.approvalRate}%
                        </dd>
                    </div>
                    <div>
                        <dt className="text-xs text-muted-foreground">Edited by a counsellor</dt>
                        <dd className="mt-1 flex items-center gap-1.5 text-xl font-semibold tabular-nums">
                            <UserPen className="size-4 text-muted-foreground" aria-hidden />
                            {rates.editRate}%
                        </dd>
                    </div>
                </dl>
            </CardContent>
        </Card>
    );
}
