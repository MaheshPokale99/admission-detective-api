import { History } from "lucide-react";
import { EmptyState } from "@/components/common/page-header";
import { OutcomeCard } from "@/features/recovery-log/components/outcome-card";
import type { AuditEntry, Intervention } from "@/lib/api";
import { AuditTrail } from "./audit-trail";

interface HistoryPanelProps {
    interventions: Intervention[];
    audit: AuditEntry[];
}

export function HistoryPanel({ interventions, audit }: HistoryPanelProps) {
    if (interventions.length === 0 && audit.length === 0) {
        return (
            <EmptyState
                icon={History}
                title="No history yet"
                description="Interventions, outcomes and the audit trail appear here once this lead has been investigated."
            />
        );
    }

    return (
        <div className="space-y-4">
            {interventions.map((intervention) => (
                <OutcomeCard key={intervention.id} intervention={intervention} />
            ))}
            <AuditTrail entries={audit} />
        </div>
    );
}
