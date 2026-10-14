"use client";

import { motion } from "framer-motion";
import { CircleCheck, CircleHelp, FileSearch, TriangleAlert } from "lucide-react";
import { ToneBadge } from "@/components/common/status-badges";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { Investigation, StallReason } from "@/lib/api";
import { REASON_LABEL } from "@/lib/labels";
import { timeAgo } from "@/lib/time";
import { EvidenceQuote } from "./evidence-quote";
import { RecommendationCard } from "./recommendation-card";

const CONFIDENCE_TONE = { high: "success", medium: "warning", low: "danger" } as const;

interface InvestigationViewProps {
    investigation: Investigation;
    onSelectMessage: (messageId: string) => void;
    onReviewDraft?: () => void;
}

export function InvestigationView({ investigation, onSelectMessage, onReviewDraft }: InvestigationViewProps) {
    const { result, createdAt } = investigation;
    const reasons = [...result.stallReasons].sort(
        (a, b) => Number(b.status === "confirmed") - Number(a.status === "confirmed"),
    );

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileSearch className="size-4 text-primary" aria-hidden />
                        Findings
                    </CardTitle>
                    <CardDescription>Analysed {timeAgo(createdAt)}</CardDescription>
                    <CardAction>
                        <ToneBadge tone={CONFIDENCE_TONE[result.confidence]} className="capitalize">
                            {result.confidence} confidence
                        </ToneBadge>
                    </CardAction>
                </CardHeader>
                <CardContent className="space-y-5">
                    <p className="leading-relaxed">{result.summary}</p>

                    <Separator />

                    <section aria-labelledby="reasons-heading" className="space-y-3">
                        <SectionHeading id="reasons-heading">Why they stopped responding</SectionHeading>
                        {reasons.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                No reason could be established from the conversation.
                            </p>
                        ) : (
                            reasons.map((reason, i) => (
                                <ReasonBlock key={i} reason={reason} index={i} onSelectMessage={onSelectMessage} />
                            ))
                        )}
                    </section>

                    {result.unmetRequests.length > 0 && (
                        <section aria-labelledby="unmet-heading" className="space-y-3">
                            <SectionHeading id="unmet-heading">Asked for, never delivered</SectionHeading>
                            {result.unmetRequests.map((unmet, i) => (
                                <div key={i} className="space-y-2 rounded-lg border p-3">
                                    <p className="text-sm font-medium">{unmet.request}</p>
                                    <EvidenceQuote evidence={unmet.evidence} onSelect={onSelectMessage} />
                                </div>
                            ))}
                        </section>
                    )}
                </CardContent>
            </Card>

            <RecommendationCard recommendation={result.recommendation} onReviewDraft={onReviewDraft} />
        </div>
    );
}

function SectionHeading({ id, children }: { id: string; children: React.ReactNode }) {
    return (
        <h3 id={id} className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {children}
        </h3>
    );
}

interface ReasonBlockProps {
    reason: StallReason;
    index: number;
    onSelectMessage: (messageId: string) => void;
}

function ReasonBlock({ reason, index, onSelectMessage }: ReasonBlockProps) {
    const confirmed = reason.status === "confirmed";
    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.07 }}
            className="space-y-2.5 rounded-lg border p-3"
        >
            <div className="flex flex-wrap items-center gap-2">
                <ToneBadge tone={confirmed ? "success" : "warning"}>
                    {confirmed ? <CircleCheck aria-hidden /> : <CircleHelp aria-hidden />}
                    {confirmed ? "Confirmed" : "Possible"}
                </ToneBadge>
                <Badge variant="secondary">{REASON_LABEL[reason.category]}</Badge>
            </div>
            <p className="text-sm font-medium">{reason.statement}</p>
            {reason.downgraded && (
                <Alert>
                    <TriangleAlert className="text-warning" />
                    <AlertDescription>Downgraded: the claimed evidence did not match the transcript.</AlertDescription>
                </Alert>
            )}
            {reason.evidence.length > 0 && (
                <div className="space-y-2">
                    {reason.evidence.map((evidence, j) => (
                        <EvidenceQuote key={j} evidence={evidence} onSelect={onSelectMessage} />
                    ))}
                </div>
            )}
            <p className="text-xs leading-relaxed text-muted-foreground">{reason.reasoning}</p>
        </motion.div>
    );
}
