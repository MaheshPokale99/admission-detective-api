"use client";

import { useMutation } from "@tanstack/react-query";
import { Pencil, Send, ShieldX, TriangleAlert, X } from "lucide-react";
import { useId, useState } from "react";
import { toast } from "sonner";
import { InterventionBadge } from "@/components/common/status-badges";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogMedia,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldTitle } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useRefreshAll } from "@/hooks/use-api";
import { ApiError, api, type Intervention } from "@/lib/api";
import { ACTION_LABEL } from "@/lib/labels";

const SUBJECT_MAX = 200;
const REASON_MAX = 500;

interface ApprovalCardProps {
    intervention: Intervention;
    leadName: string;
    leadEmail: string;
    reviewer: string;
}

const errorDescription = (e: Error) =>
    e instanceof ApiError && e.reasons.length > 0 ? e.reasons.join(" · ") : undefined;

/** Human-in-the-loop editor: the counsellor reviews, edits, then approves or rejects an AI draft. */
export function ApprovalCard({ intervention: iv, leadName, leadEmail, reviewer }: ApprovalCardProps) {
    const refresh = useRefreshAll();
    const uid = useId();
    const [subject, setSubject] = useState(iv.draftSubject);
    const [body, setBody] = useState(iv.draftBody);
    const [rejectOpen, setRejectOpen] = useState(false);
    const [reason, setReason] = useState("");

    const edited = subject !== iv.draftSubject || body !== iv.draftBody;

    const approve = useMutation({
        mutationFn: () => api.approve(iv.id, { reviewer, subject, body }),
        onSuccess: async () => {
            await refresh();
            toast.success(`Approved and sent to ${leadName}`);
        },
        onError: async (e) => {
            await refresh();
            toast.error(e.message, { description: errorDescription(e) });
        },
    });

    const reject = useMutation({
        mutationFn: () => api.reject(iv.id, { reviewer, reason: reason.trim() }),
        onSuccess: async () => {
            setRejectOpen(false);
            await refresh();
            toast.success("Draft rejected", { description: "Nothing was sent to the student." });
        },
        onError: (e) => toast.error(e.message, { description: errorDescription(e) }),
    });

    const busy = approve.isPending || reject.isPending;
    const canApprove = subject.trim().length > 0 && body.trim().length > 0;

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle>{ACTION_LABEL[iv.action]}</CardTitle>
                <CardDescription>Review and edit if needed. Exactly this text is sent, nothing else.</CardDescription>
                <CardAction>
                    <InterventionBadge status={iv.status} />
                </CardAction>
            </CardHeader>
            <CardContent>
                <FieldGroup className="gap-4">
                    {iv.status === "failed" && (
                        <Alert variant="destructive">
                            <TriangleAlert />
                            <AlertTitle>The last attempt could not be sent</AlertTitle>
                            <AlertDescription>Nothing reached the student. Approve again to retry.</AlertDescription>
                        </Alert>
                    )}
                    {iv.warnings.length > 0 && (
                        <Alert className="*:[svg]:text-warning">
                            <TriangleAlert />
                            <AlertTitle>Check before approving</AlertTitle>
                            <AlertDescription>
                                <ul className="list-disc space-y-0.5 pl-4">
                                    {iv.warnings.map((w) => (
                                        <li key={w}>{w}</li>
                                    ))}
                                </ul>
                            </AlertDescription>
                        </Alert>
                    )}

                    <Field>
                        <FieldTitle>To</FieldTitle>
                        <p className="text-sm break-words">
                            <span className="font-medium">{leadName}</span>{" "}
                            <span className="text-muted-foreground">&lt;{leadEmail}&gt;</span>
                        </p>
                    </Field>

                    <Field>
                        <FieldLabel htmlFor={`${uid}-subject`}>Subject</FieldLabel>
                        <Input
                            id={`${uid}-subject`}
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            maxLength={SUBJECT_MAX}
                            disabled={busy}
                            aria-describedby={`${uid}-subject-count`}
                        />
                        <FieldDescription id={`${uid}-subject-count`} className="text-right tabular-nums">
                            {subject.length}/{SUBJECT_MAX}
                        </FieldDescription>
                    </Field>

                    <Field>
                        <FieldLabel htmlFor={`${uid}-body`}>Message</FieldLabel>
                        <Textarea
                            id={`${uid}-body`}
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            rows={12}
                            disabled={busy}
                            className="leading-relaxed"
                            aria-describedby={`${uid}-body-count`}
                        />
                        <FieldDescription id={`${uid}-body-count`} className="text-right tabular-nums">
                            {body.length} characters
                        </FieldDescription>
                    </Field>
                </FieldGroup>
            </CardContent>
            <CardFooter className="flex-wrap justify-end gap-2">
                {edited && (
                    <span className="mr-auto flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Pencil className="size-3.5" aria-hidden /> Edited from the original draft
                    </span>
                )}

                <AlertDialog
                    open={rejectOpen}
                    onOpenChange={(open) => {
                        if (!reject.isPending) setRejectOpen(open);
                    }}
                >
                    <AlertDialogTrigger render={<Button variant="outline" disabled={busy} />}>
                        <X data-icon="inline-start" /> Reject
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogMedia>
                                <ShieldX />
                            </AlertDialogMedia>
                            <AlertDialogTitle>Reject this draft?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Nothing will be sent to {leadName}. Your reason is saved in the audit trail.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <Field>
                            <FieldLabel htmlFor={`${uid}-reason`}>Reason (optional)</FieldLabel>
                            <Textarea
                                id={`${uid}-reason`}
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                maxLength={REASON_MAX}
                                rows={3}
                                placeholder="e.g. I will call the family personally"
                                disabled={reject.isPending}
                            />
                            <FieldDescription className="text-right tabular-nums">
                                {reason.length}/{REASON_MAX}
                            </FieldDescription>
                        </Field>
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={reject.isPending}>Keep draft</AlertDialogCancel>
                            <AlertDialogAction
                                variant="destructive"
                                disabled={reject.isPending}
                                onClick={() => reject.mutate()}
                            >
                                {reject.isPending ? (
                                    <Spinner data-icon="inline-start" />
                                ) : (
                                    <X data-icon="inline-start" />
                                )}
                                Reject draft
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                <Button onClick={() => approve.mutate()} disabled={busy || !canApprove}>
                    {approve.isPending ? <Spinner data-icon="inline-start" /> : <Send data-icon="inline-start" />}
                    Approve &amp; send
                </Button>
            </CardFooter>
        </Card>
    );
}
