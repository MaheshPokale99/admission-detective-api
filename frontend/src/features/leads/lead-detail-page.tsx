"use client";

import { MotionConfig } from "framer-motion";
import { CircleAlert, FileText, History, ScanSearch, SearchCheck, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { EmptyState, ErrorState } from "@/components/common/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useHealth, useLead } from "@/hooks/use-api";
import { ApiError, type Health, type Intervention, type LeadSummary } from "@/lib/api";
import { Conversation, type MessageFocus } from "./components/conversation";
import { DraftPanel } from "./components/draft-panel";
import { HistoryPanel } from "./components/history-panel";
import { InvestigationView } from "./components/investigation-view";
import { LiveInvestigation } from "./components/investigation-trail";
import { LeadDetailSkeleton } from "./components/lead-detail-skeleton";
import { LeadHeader } from "./components/lead-header";
import { ProtectedAlert } from "./components/protected-alert";
import { useInvestigation } from "./hooks/use-investigation";

type TabId = "findings" | "draft" | "history";

function investigateBlockedReason(
    lead: LeadSummary,
    health: Health | undefined,
    actionable: Intervention | undefined,
): string | null {
    if (!health) return "Loading…";
    if (lead.status === "closed") return "This lead is closed.";
    if (!lead.contactable) {
        const why = lead.protectedReasons.join("; ");
        return why ? `Outreach is locked: ${why}` : "Outreach is locked for this lead.";
    }
    if (!health.gemini.configured) return "Investigation is not available right now.";
    if (actionable) return "A draft is already waiting. Approve or reject it before re-investigating.";
    return null;
}

export function LeadDetailPage({ id }: { id: string }) {
    const { data, isPending, error, refetch } = useLead(id);
    const { data: health } = useHealth();
    const [tab, setTab] = useState<TabId | null>(null);
    const [focus, setFocus] = useState<MessageFocus | null>(null);
    const investigation = useInvestigation(id, { onReviewDraft: () => setTab("draft") });

    if (error) {
        const notFound = error instanceof ApiError && error.status === 404;
        return (
            <div className="space-y-4">
                <ErrorState
                    title={notFound ? "Lead not found" : "Could not load this lead"}
                    message={notFound ? "This lead does not exist or was removed." : error.message}
                    onRetry={notFound ? undefined : () => refetch()}
                />
                <div className="flex justify-center">
                    <Button variant="outline" nativeButton={false} render={<Link href="/leads" />}>
                        Back to Lead Radar
                    </Button>
                </div>
            </div>
        );
    }
    if (isPending) return <LeadDetailSkeleton />;

    const { lead, messages, investigations, interventions, audit } = data;
    const latest = investigations[0];
    const actionable = interventions.find(
        (i) => i.status === "pending_approval" || (i.status === "failed" && lead.contactable),
    );
    const history = interventions.filter((i) => i.id !== actionable?.id);
    const activeTab: TabId = tab ?? (actionable?.status === "pending_approval" ? "draft" : "findings");
    const selectMessage = (messageId: string | null) => setFocus(messageId ? { id: messageId, key: Date.now() } : null);

    const run = () => {
        setTab("findings");
        investigation.run();
    };

    return (
        <MotionConfig reducedMotion="user">
            <div className="space-y-6">
                <LeadHeader
                    lead={lead}
                    isRunning={investigation.isRunning}
                    isReinvestigation={!!latest}
                    disabledReason={investigateBlockedReason(lead, health, actionable)}
                    onRun={run}
                />

                {lead.status === "protected" && <ProtectedAlert reasons={lead.protectedReasons} />}

                <div className="grid items-start gap-6 lg:grid-cols-5">
                    <div className="min-w-0 lg:sticky lg:top-20 lg:col-span-2">
                        <Conversation messages={messages} focus={focus} onSelect={selectMessage} />
                    </div>

                    <Tabs
                        value={activeTab}
                        onValueChange={(value) => setTab(value as TabId)}
                        className="min-w-0 max-lg:order-first lg:col-span-3"
                    >
                        <TabsList className="h-9 w-full">
                            <TabsTrigger value="findings">
                                <SearchCheck aria-hidden />
                                Findings
                            </TabsTrigger>
                            <TabsTrigger value="draft">
                                <FileText aria-hidden />
                                <span className="max-sm:hidden">Draft &amp; approval</span>
                                <span className="sm:hidden">Draft</span>
                                {actionable && (
                                    <span
                                        role="status"
                                        aria-label="Awaiting your review"
                                        className="size-2 rounded-full bg-warning"
                                    />
                                )}
                            </TabsTrigger>
                            <TabsTrigger value="history">
                                <History aria-hidden />
                                History
                                {history.length > 0 && (
                                    <Badge variant="secondary" className="h-4 px-1.5 tabular-nums">
                                        {history.length}
                                    </Badge>
                                )}
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="findings" className="space-y-4 pt-2">
                            {investigation.isRunning ? (
                                <LiveInvestigation steps={investigation.steps} />
                            ) : (
                                <>
                                    {investigation.error && (
                                        <Alert variant="destructive">
                                            <CircleAlert />
                                            <AlertTitle>The investigation did not finish</AlertTitle>
                                            <AlertDescription>
                                                {investigation.error.message}
                                                {investigation.error instanceof ApiError &&
                                                    investigation.error.reasons.length > 0 && (
                                                        <ul className="mt-1 list-disc pl-4">
                                                            {investigation.error.reasons.map((reason) => (
                                                                <li key={reason}>{reason}</li>
                                                            ))}
                                                        </ul>
                                                    )}
                                            </AlertDescription>
                                        </Alert>
                                    )}
                                    {latest ? (
                                        <InvestigationView
                                            investigation={latest}
                                            onSelectMessage={selectMessage}
                                            onReviewDraft={actionable ? () => setTab("draft") : undefined}
                                        />
                                    ) : (
                                        <EmptyState
                                            icon={lead.contactable ? Sparkles : ScanSearch}
                                            title="No investigation yet"
                                            description={
                                                lead.contactable
                                                    ? "Investigate to see why this lead went quiet and get a drafted follow-up. Nothing is sent without your approval."
                                                    : "Outreach is locked for this lead, so it cannot be investigated."
                                            }
                                        />
                                    )}
                                </>
                            )}
                        </TabsContent>

                        <TabsContent value="draft" className="pt-2">
                            <DraftPanel
                                lead={lead}
                                actionable={actionable}
                                latest={latest}
                                onShowFindings={() => setTab("findings")}
                            />
                        </TabsContent>

                        <TabsContent value="history" className="pt-2">
                            <HistoryPanel interventions={history} audit={audit} />
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </MotionConfig>
    );
}
