import { FileSearch, Lock, MailCheck, ScanSearch } from "lucide-react";
import { EmptyState } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { ApprovalCard } from "@/features/approvals/components/approval-card";
import type { Intervention, Investigation, LeadSummary } from "@/lib/api";

interface DraftPanelProps {
    lead: LeadSummary;
    actionable: Intervention | undefined;
    latest: Investigation | undefined;
    onShowFindings: () => void;
}

export function DraftPanel({ lead, actionable, latest, onShowFindings }: DraftPanelProps) {
    if (actionable) {
        return (
            <ApprovalCard
                key={actionable.id}
                intervention={actionable}
                leadName={lead.name}
                leadEmail={lead.email}
                reviewer={lead.counsellor}
            />
        );
    }

    if (!lead.contactable) {
        return (
            <EmptyState
                icon={Lock}
                title="No outreach possible"
                description="This lead is protected, so no draft can be created or sent. Review the reasons above."
            />
        );
    }

    if (!latest) {
        return (
            <EmptyState
                icon={ScanSearch}
                title="No draft yet"
                description="Investigate this lead first. A drafted follow-up will wait here for your approval."
            />
        );
    }

    const noOutreach = latest.result.recommendation.action === "no_action";
    return (
        <EmptyState
            icon={noOutreach ? FileSearch : MailCheck}
            title={noOutreach ? "No outreach is recommended" : "Nothing is waiting for approval"}
            description={
                noOutreach
                    ? "The latest investigation found no safe or useful follow-up. Read the findings to see why."
                    : "Past drafts and their outcomes are under History. Re-investigate to create a fresh draft."
            }
            action={
                <Button variant="outline" size="sm" onClick={onShowFindings}>
                    View findings
                </Button>
            }
        />
    );
}
