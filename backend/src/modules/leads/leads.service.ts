import { NotFoundError } from "../../common/errors/app-error.js";
import { groupBy } from "../../common/utils/collections.js";
import type { BusinessRules } from "../../domain/business-rules.js";
import { checkContactability, type Contactability } from "../../domain/contactability.js";
import type { AuditRepository } from "../audit/audit.repository.js";
import type { InterventionsRepository } from "../interventions/interventions.repository.js";
import type { InvestigationsRepository } from "../investigations/investigations.repository.js";
import type { MessagesRepository } from "../messages/messages.repository.js";
import { buildLeadSummary, type SummaryContext } from "./lead-summary.js";
import type { LeadsRepository } from "./leads.repository.js";
import type { Lead, LeadSummary } from "./leads.types.js";

export interface LeadsServiceDeps {
    leads: LeadsRepository;
    messages: MessagesRepository;
    interventions: InterventionsRepository;
    investigations: InvestigationsRepository;
    audit: AuditRepository;
    rules: BusinessRules;
}

export class LeadsService {
    constructor(private readonly deps: LeadsServiceDeps) {}

    async getById(id: string): Promise<Lead> {
        const lead = await this.deps.leads.findById(id);
        if (!lead) throw new NotFoundError("Lead not found");
        return lead;
    }

    /** Applies the consent, eligibility, stage and cooldown rules to one lead. */
    async checkContactability(lead: Lead): Promise<Contactability> {
        const lastSentAt = await this.deps.interventions.findLastSentAt(lead.id);
        return checkContactability(lead, lastSentAt, this.deps.rules);
    }

    async list(): Promise<LeadSummary[]> {
        const [leads, ctx] = await Promise.all([this.deps.leads.findAll(), this.loadContext(null)]);
        return leads.map((lead) => buildLeadSummary(lead, ctx, this.deps.rules));
    }

    async detail(id: string) {
        const lead = await this.getById(id);
        const [ctx, messages, investigations, audit] = await Promise.all([
            this.loadContext([id]),
            this.deps.messages.findByLead(id),
            this.deps.investigations.findByLead(id),
            this.deps.audit.findByLead(id),
        ]);

        return {
            lead: buildLeadSummary(lead, ctx, this.deps.rules),
            messages,
            investigations,
            interventions: ctx.interventions.get(id) ?? [],
            audit,
        };
    }

    private async loadContext(leadIds: string[] | null): Promise<SummaryContext> {
        const [latest, interventions, investigated] = await Promise.all([
            this.deps.messages.findLatestByLeads(leadIds),
            this.deps.interventions.list({ leadIds }),
            this.deps.investigations.findInvestigatedLeadIds(leadIds),
        ]);
        return {
            lastMessage: new Map(latest.map((m) => [m.leadId, m])),
            interventions: groupBy(interventions, (i) => i.leadId),
            investigated,
        };
    }
}
