import { MAX_BODY_LENGTH, MAX_SUBJECT_LENGTH } from "../../common/constants.js";
import { ConflictError, NotFoundError, ValidationError } from "../../common/errors/app-error.js";
import { newId } from "../../common/utils/ids.js";
import { nowIso } from "../../common/utils/time.js";
import type { Transactional } from "../../database/database.js";
import type { EmailSender } from "../../integrations/email/email-sender.js";
import type { AuditRepository } from "../audit/audit.repository.js";
import type { LeadsRepository } from "../leads/leads.repository.js";
import type { LeadsService } from "../leads/leads.service.js";
import { MessageChannel, MessageDirection } from "../../generated/prisma/enums.js";
import type { MessagesRepository } from "../messages/messages.repository.js";
import type { InterventionsRepository } from "./interventions.repository.js";
import type { Intervention, InterventionStatus } from "./interventions.types.js";

export interface InterventionsServiceDeps {
    interventions: InterventionsRepository;
    leads: LeadsService;
    leadsRepository: LeadsRepository;
    messages: MessagesRepository;
    audit: AuditRepository;
    email: EmailSender;
    transactions: Transactional;
}

export class InterventionsService {
    constructor(private readonly deps: InterventionsServiceDeps) {}

    async list(status?: InterventionStatus) {
        const [rows, leads] = await Promise.all([
            this.deps.interventions.list({ status }),
            this.deps.leadsRepository.findAll(),
        ]);
        const leadById = new Map(leads.map((l) => [l.id, l]));

        return rows.map((i) => {
            const lead = leadById.get(i.leadId);
            return {
                ...i,
                lead: lead
                    ? {
                          id: lead.id,
                          name: lead.name,
                          stage: lead.stage,
                          counsellor: lead.counsellor,
                          email: lead.email,
                      }
                    : null,
            };
        });
    }

    /** The only path that sends a message: re-checks consent, claims the draft atomically, persists the approved text, sends it. */
    async approveAndSend(id: string, reviewer: string, subject: string, body: string): Promise<Intervention> {
        const intervention = await this.getById(id);
        const lead = await this.deps.leads.getById(intervention.leadId);

        const finalSubject = subject.trim();
        const finalBody = body.trim();
        if (!finalSubject || finalSubject.length > MAX_SUBJECT_LENGTH) {
            throw new ValidationError(`Subject is required (max ${MAX_SUBJECT_LENGTH} characters)`);
        }
        if (!finalBody || finalBody.length > MAX_BODY_LENGTH) {
            throw new ValidationError(`Message is required (max ${MAX_BODY_LENGTH} characters)`);
        }

        const contact = await this.deps.leads.checkContactability(lead);
        if (!contact.ok) {
            if (intervention.status === "pending_approval") {
                const detail = contact.reasons.join("; ");
                await this.deps.interventions.markFailed(id, `Blocked at send time: ${detail}`);
                await this.deps.audit.log({
                    leadId: lead.id,
                    interventionId: id,
                    actor: "System",
                    action: "blocked",
                    detail,
                });
            }
            throw new ConflictError("This lead can no longer be contacted", contact.reasons);
        }

        const edited = finalSubject !== intervention.draftSubject || finalBody !== intervention.draftBody;
        const claimed = await this.deps.interventions.claimForSending(id, reviewer, finalSubject, finalBody, edited);
        if (!claimed) throw new ConflictError(`This message is already ${intervention.status}`);
        await this.deps.audit.log({
            leadId: lead.id,
            interventionId: id,
            actor: reviewer,
            action: edited ? "approved_with_edits" : "approved",
        });

        try {
            const result = await this.deps.email.send(lead.email, finalSubject, finalBody);
            await this.deps.transactions.transaction(async () => {
                await this.deps.interventions.markSent(id, result.provider, result.messageId);
                await this.deps.messages.create({
                    id: newId("m"),
                    leadId: lead.id,
                    channel: MessageChannel.email,
                    direction: MessageDirection.outbound,
                    author: lead.counsellor,
                    body: `${finalSubject}\n\n${finalBody}`,
                    sentAt: nowIso(),
                });
                await this.deps.audit.log({
                    leadId: lead.id,
                    interventionId: id,
                    actor: "System",
                    action: "sent",
                    detail: result.provider,
                });
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            await this.deps.interventions.markFailed(id, message);
            await this.deps.audit.log({
                leadId: lead.id,
                interventionId: id,
                actor: "System",
                action: "send_failed",
                detail: message,
            });
        }
        return this.getById(id);
    }

    async reject(id: string, reviewer: string, reason: string): Promise<Intervention> {
        const intervention = await this.getById(id);
        const rejected = await this.deps.interventions.reject(id, reviewer, reason);
        if (!rejected) throw new ConflictError(`This message is already ${intervention.status}`);
        await this.deps.audit.log({
            leadId: intervention.leadId,
            interventionId: id,
            actor: reviewer,
            action: "rejected",
            detail: reason,
        });
        return rejected;
    }

    private async getById(id: string): Promise<Intervention> {
        const intervention = await this.deps.interventions.findById(id);
        if (!intervention) throw new NotFoundError("Intervention not found");
        return intervention;
    }
}
