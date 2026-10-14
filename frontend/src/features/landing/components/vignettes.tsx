import { CircleCheck, CircleDashed, CircleHelp, Clock, Send, X } from "lucide-react";
import { ToneBadge } from "@/components/common/status-badges";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel, FieldTitle } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";

/** Static copy of a findings card: one confirmed reason with a verified quote and one possible reason. */
export function FindingsVignette() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Why this lead went quiet</CardTitle>
                <CardDescription>Sample lead. Every quote is checked against the transcript.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="space-y-2.5 rounded-lg border p-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <ToneBadge tone="success">
                            <CircleCheck aria-hidden />
                            Confirmed
                        </ToneBadge>
                        <Badge variant="secondary">Fee concern</Badge>
                    </div>
                    <p className="text-sm font-medium">The family found the first-year fee higher than planned.</p>
                    <div className="flex flex-col gap-1.5 rounded-lg border bg-background px-3 py-2 text-sm">
                        <span className="italic">&ldquo;Papa says the fee is more than we budgeted.&rdquo;</span>
                        <span className="flex items-center gap-1.5 text-xs text-success">
                            <CircleCheck className="size-3.5 shrink-0" aria-hidden />
                            Verified in transcript
                        </span>
                    </div>
                </div>

                <div className="space-y-2.5 rounded-lg border border-dashed p-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <ToneBadge tone="warning">
                            <CircleHelp aria-hidden />
                            Possible
                        </ToneBadge>
                        <Badge variant="secondary">Parent decision</Badge>
                    </div>
                    <p className="text-sm font-medium">A parent may still be comparing other colleges.</p>
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <CircleDashed className="size-3.5 shrink-0" aria-hidden />
                        No direct quote, so this stays a possibility.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}

/** Static copy of the approval editor; inert so it reads as a picture of the real one. */
export function ApprovalVignette() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Follow-up draft</CardTitle>
                <CardDescription>Review and edit if needed. Exactly this text is sent.</CardDescription>
            </CardHeader>
            <CardContent>
                <div inert>
                    <FieldGroup className="gap-4">
                        <Field>
                            <FieldTitle>Status</FieldTitle>
                            <div>
                                <ToneBadge tone="warning">
                                    <Clock aria-hidden />
                                    Pending approval
                                </ToneBadge>
                            </div>
                        </Field>
                        <Field>
                            <FieldLabel htmlFor="demo-subject">Subject</FieldLabel>
                            <Input id="demo-subject" readOnly value="Your NIAT fee plan, step by step" />
                        </Field>
                        <Field>
                            <FieldLabel htmlFor="demo-body">Message</FieldLabel>
                            <Textarea
                                id="demo-body"
                                readOnly
                                rows={4}
                                className="leading-relaxed"
                                value={
                                    "Hi Aarav, you mentioned the first-year fee on 3 March. Here is the instalment plan that spreads it across four payments. Happy to walk your parents through it."
                                }
                            />
                        </Field>
                    </FieldGroup>
                </div>
            </CardContent>
            <CardFooter className="justify-end gap-2" aria-hidden>
                <Button variant="outline" tabIndex={-1}>
                    <X data-icon="inline-start" /> Reject
                </Button>
                <Button tabIndex={-1}>
                    <Send data-icon="inline-start" /> Approve &amp; send
                </Button>
            </CardFooter>
        </Card>
    );
}

const SAMPLE = [
    { label: "Offer parent session", recovered: 2, sent: 3, rate: 67 },
    { label: "Send fee details", recovered: 2, sent: 3, rate: 67 },
] as const;

/** Static effectiveness list with clearly labelled sample numbers. */
export function OutcomesVignette() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>What works</CardTitle>
                <CardDescription>Recovery rate by follow-up type</CardDescription>
            </CardHeader>
            <CardContent>
                <ul className="space-y-4">
                    {SAMPLE.map((row) => (
                        <li key={row.label} className="space-y-2">
                            <div className="flex items-center justify-between gap-3 text-sm">
                                <span className="min-w-0 truncate font-medium">{row.label}</span>
                                <span className="shrink-0 text-muted-foreground tabular-nums">
                                    {row.recovered}/{row.sent} &middot;{" "}
                                    <span className="font-medium text-foreground">{row.rate}%</span>
                                </span>
                            </div>
                            <Progress value={row.rate} aria-label={`${row.label} recovery rate`} />
                        </li>
                    ))}
                </ul>
            </CardContent>
            <CardFooter className="justify-between text-xs text-muted-foreground">
                <Badge variant="secondary">Sample data</Badge>
                <span>Small samples are flagged in the app</span>
            </CardFooter>
        </Card>
    );
}
