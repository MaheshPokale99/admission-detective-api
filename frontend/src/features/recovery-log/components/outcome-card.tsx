"use client";

import { useMutation } from "@tanstack/react-query";
import {
    CalendarCheck,
    ChevronDown,
    FileCheck,
    GraduationCap,
    MessageSquareReply,
    MinusCircle,
    TriangleAlert,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { InterventionBadge, OutcomeBadge, ToneBadge } from "@/components/common/status-badges";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Spinner } from "@/components/ui/spinner";
import { useRefreshAll } from "@/hooks/use-api";
import { ApiError, api, type Intervention, type OutcomeType } from "@/lib/api";
import { ACTION_LABEL, OUTCOME_LABEL } from "@/lib/labels";
import { dateTime } from "@/lib/time";

const OPTIONS: { type: OutcomeType; icon: LucideIcon }[] = [
    { type: "replied", icon: MessageSquareReply },
    { type: "session_booked", icon: CalendarCheck },
    { type: "application_resumed", icon: FileCheck },
    { type: "admitted", icon: GraduationCap },
    { type: "no_response", icon: MinusCircle },
];

function describe(iv: Intervention) {
    const parts = [iv.sentAt ? `Sent ${dateTime(iv.sentAt)}` : `Created ${dateTime(iv.createdAt)}`];
    if (iv.reviewedBy) parts.push(`${iv.status === "rejected" ? "rejected" : "approved"} by ${iv.reviewedBy}`);
    return parts.join(" · ");
}

/** The sent message, what happened next, and a way to record the next outcome. */
export function OutcomeCard({ intervention: iv }: { intervention: Intervention }) {
    const refresh = useRefreshAll();
    const record = useMutation({
        mutationFn: (type: OutcomeType) => api.recordOutcome(iv.id, { type, note: "" }),
        onSuccess: async (_, type) => {
            await refresh();
            toast.success("Outcome recorded", { description: OUTCOME_LABEL[type] });
        },
        onError: (e) =>
            toast.error(e.message, {
                description: e instanceof ApiError && e.reasons.length > 0 ? e.reasons.join(" · ") : undefined,
            }),
    });

    const sent = iv.status === "sent";

    return (
        <Card>
            <CardHeader>
                <CardTitle>{ACTION_LABEL[iv.action]}</CardTitle>
                <CardDescription>{describe(iv)}</CardDescription>
                <CardAction className="flex flex-wrap justify-end gap-1.5">
                    {iv.edited && <ToneBadge tone="info">Edited</ToneBadge>}
                    <InterventionBadge status={iv.status} />
                </CardAction>
            </CardHeader>

            {iv.status === "rejected" && iv.rejectionReason && (
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">Reason for rejecting: </span>
                        {iv.rejectionReason}
                    </p>
                </CardContent>
            )}

            {iv.status === "failed" && (
                <CardContent>
                    <Alert variant="destructive">
                        <TriangleAlert />
                        <AlertTitle>Message could not be delivered</AlertTitle>
                        <AlertDescription>The message could not be sent. Open the lead to try again.</AlertDescription>
                    </Alert>
                </CardContent>
            )}

            {sent && (
                <CardContent className="space-y-5">
                    <Collapsible className="rounded-lg border bg-muted/40">
                        <CollapsibleTrigger
                            render={
                                <Button variant="ghost" className="h-auto w-full justify-between gap-3 px-3 py-2.5" />
                            }
                        >
                            <span className="min-w-0 truncate text-left">
                                <span className="text-xs font-normal text-muted-foreground">Message sent</span>
                                <span className="block truncate">{iv.finalSubject}</span>
                            </span>
                            <ChevronDown
                                className="transition-transform group-data-[panel-open]/button:rotate-180"
                                data-icon="inline-end"
                                aria-hidden
                            />
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                            <p className="border-t px-3 py-3 text-sm whitespace-pre-wrap text-muted-foreground">
                                {iv.finalBody}
                            </p>
                        </CollapsibleContent>
                    </Collapsible>

                    <section aria-label="Outcome history">
                        <h3 className="mb-3 text-sm font-medium">What happened next</h3>
                        {iv.outcomes.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No response recorded yet.</p>
                        ) : (
                            <ol className="relative ml-1.5 space-y-3 border-l pl-4">
                                {iv.outcomes.map((o) => (
                                    <li key={o.id} className="relative flex flex-wrap items-center gap-2">
                                        <span
                                            className="absolute top-1/2 -left-[21px] size-2 -translate-y-1/2 rounded-full bg-border ring-4 ring-card"
                                            aria-hidden
                                        />
                                        <OutcomeBadge type={o.type} />
                                        <time dateTime={o.createdAt} className="text-xs text-muted-foreground">
                                            {dateTime(o.createdAt)}
                                        </time>
                                    </li>
                                ))}
                            </ol>
                        )}
                    </section>

                    <section className="space-y-2 border-t pt-4" aria-labelledby={`record-${iv.id}`}>
                        <h3 id={`record-${iv.id}`} className="text-sm font-medium">
                            Record what happened next
                        </h3>
                        <p className="text-xs text-muted-foreground">
                            Choose what the student did after this message so the results stay accurate.
                        </p>
                        <div role="group" aria-labelledby={`record-${iv.id}`} className="flex flex-wrap gap-2">
                            {OPTIONS.map(({ type, icon: Icon }) => (
                                <Button
                                    key={type}
                                    size="sm"
                                    variant="outline"
                                    disabled={record.isPending}
                                    onClick={() => record.mutate(type)}
                                >
                                    {record.isPending && record.variables === type ? (
                                        <Spinner data-icon="inline-start" />
                                    ) : (
                                        <Icon data-icon="inline-start" />
                                    )}
                                    {OUTCOME_LABEL[type]}
                                </Button>
                            ))}
                        </div>
                    </section>
                </CardContent>
            )}
        </Card>
    );
}
