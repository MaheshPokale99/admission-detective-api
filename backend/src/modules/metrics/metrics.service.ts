import type { InterventionsRepository } from "../interventions/interventions.repository.js";
import type { LeadsService } from "../leads/leads.service.js";
import { STAGE_ORDER, type LeadStage } from "../leads/leads.types.js";
import { buckets, percent, timeline, totals } from "./analytics.js";

export class MetricsService {
    constructor(
        private readonly leads: LeadsService,
        private readonly interventions: InterventionsRepository,
    ) {}

    async overview() {
        const [summaries, rows] = await Promise.all([this.leads.list(), this.interventions.list()]);
        const counts = totals(rows);

        const protectedLeads = summaries.filter((l) => l.status === "protected");
        const protectedBy: Record<string, number> = {};
        for (const lead of protectedLeads) {
            for (const reason of lead.protectedReasons) protectedBy[reason] = (protectedBy[reason] ?? 0) + 1;
        }

        return {
            funnel: STAGE_ORDER.map((stage: LeadStage) => ({
                stage,
                count: summaries.filter((l) => l.stage === stage).length,
            })),
            totals: {
                leads: summaries.length,
                stalled: summaries.filter((l) => l.stalled && l.status !== "closed").length,
                readyToInvestigate: summaries.filter((l) => l.status === "ready").length,
                protected: protectedLeads.length,
                awaitingApproval: counts.pending,
                sent: counts.sent,
                recovered: counts.recovered,
                admitted: counts.admitted,
            },
            rates: {
                recoveryRate: percent(counts.recovered, counts.sent),
                admissionRate: percent(counts.admitted, counts.sent),
                approvalRate: percent(counts.sent, counts.sent + counts.rejected),
                editRate: percent(counts.edited, counts.sent),
            },
            byAction: buckets(rows, "action"),
            byReason: buckets(rows, "reason"),
            safety: { protectedStalled: protectedLeads.length, byReason: protectedBy },
            timeline: timeline(rows),
        };
    }
}
