import { ConflictError, NotFoundError } from "../../common/errors/app-error.js";
import { newId } from "../../common/utils/ids.js";
import { nowIso } from "../../common/utils/time.js";
import type { Transactional } from "../../database/database.js";
import { MessageChannel, MessageDirection } from "../../generated/prisma/enums.js";
import type { AuditRepository } from "../audit/audit.repository.js";
import type { InterventionsRepository } from "../interventions/interventions.repository.js";
import { InterventionStatus } from "../interventions/interventions.types.js";
import type { LeadsRepository } from "../leads/leads.repository.js";
import { LeadStage, STAGE_ORDER } from "../leads/leads.types.js";
import type { MessagesRepository } from "../messages/messages.repository.js";
import type { OutcomesRepository } from "./outcomes.repository.js";
import { OutcomeType } from "./outcomes.types.js";

const OUTCOME_LABEL: Record<OutcomeType, string> = {
    replied: "Lead replied",
    session_booked: "Lead booked a session or call",
    application_resumed: "Lead resumed the application",
    admitted: "Lead took admission",
    no_response: "No response",
};

export interface OutcomesServiceDeps {
    outcomes: OutcomesRepository;
    interventions: InterventionsRepository;
    leads: LeadsRepository;
    messages: MessagesRepository;
    audit: AuditRepository;
    transactions: Transactional;
}

export class OutcomesService {
    constructor(private readonly deps: OutcomesServiceDeps) {}

    /** Records what the student did after a sent message; a reply webhook or CRM sync can call this too. */
    async record(interventionId: string, type: OutcomeType, note: string): Promise<void> {
        const intervention = await this.deps.interventions.findById(interventionId);
        if (!intervention) throw new NotFoundError("Intervention not found");
        if (intervention.status !== InterventionStatus.sent) {
            throw new ConflictError("Outcomes can only be recorded for messages that were sent");
        }
        const lead = await this.deps.leads.findById(intervention.leadId);
        if (!lead) throw new NotFoundError("Lead not found");

        await this.deps.transactions.transaction(async () => {
            await this.deps.outcomes.create({ interventionId, leadId: lead.id, type, note });
            await this.deps.audit.log({
                leadId: lead.id,
                interventionId,
                actor: "System",
                action: `outcome:${type}`,
                detail: note,
            });
            if (type === OutcomeType.no_response) return;

            const at = nowIso();
            await this.deps.leads.touch(lead.id, at);
            const isReply = type === OutcomeType.replied;
            await this.deps.messages.create({
                id: newId("m"),
                leadId: lead.id,
                channel: isReply ? MessageChannel.email : MessageChannel.call_note,
                direction: isReply ? MessageDirection.inbound : MessageDirection.internal,
                author: isReply ? lead.name : "System",
                body: note || OUTCOME_LABEL[type],
                sentAt: at,
            });

            const target =
                type === OutcomeType.admitted
                    ? LeadStage.admitted
                    : type === OutcomeType.application_resumed
                      ? LeadStage.applied
                      : null;
            const advances = target && STAGE_ORDER.indexOf(target) > STAGE_ORDER.indexOf(lead.stage);
            if (target && (lead.stage === LeadStage.lost || advances)) {
                await this.deps.leads.updateStage(lead.id, target);
            }
        });
    }
}
