"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CircleCheck, Loader2, ScanSearch } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { TraceStep } from "@/lib/api";

interface InvestigationTrailProps {
    steps: TraceStep[];
    running?: boolean;
}

/** Recorded or live list of the tool calls the agent made. */
function InvestigationTrail({ steps, running = false }: InvestigationTrailProps) {
    return (
        <ol aria-live={running ? "polite" : undefined} className="space-y-3">
            <AnimatePresence initial={false}>
                {steps.map((step, i) => (
                    <motion.li
                        key={`${step.tool}-${i}`}
                        layout="position"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.25 }}
                        className="flex items-start gap-3 text-sm"
                    >
                        <CircleCheck className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                        <span className="min-w-0">
                            <span className="block font-medium">{step.label}</span>
                            <span className="block text-xs text-muted-foreground">{step.summary}</span>
                        </span>
                    </motion.li>
                ))}
                {running && (
                    <motion.li
                        key="reasoning"
                        layout="position"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-3 text-sm text-muted-foreground"
                    >
                        <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
                        {steps.length === 0 ? "Starting the investigation…" : "Analysing the evidence…"}
                    </motion.li>
                )}
            </AnimatePresence>
        </ol>
    );
}

/** Asymptotic progress: the real number of steps is unknown while the stream is open. */
const progressFor = (steps: number) => Math.round(100 * (1 - 0.78 ** (steps + 1)));

export function LiveInvestigation({ steps }: { steps: TraceStep[] }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <ScanSearch className="size-4 animate-pulse text-primary" aria-hidden />
                    Investigating
                </CardTitle>
                <CardDescription>Reading the case file and checking the facts.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Progress value={progressFor(steps.length)} aria-label="Investigation progress" />
                <InvestigationTrail steps={steps} running />
            </CardContent>
        </Card>
    );
}
