import { ConflictError } from "../../common/errors/app-error.js";
import { unique } from "../../common/utils/collections.js";
import { newId } from "../../common/utils/ids.js";
import { nowIso } from "../../common/utils/time.js";
import type { Transactional } from "../../database/database.js";
import { strayUrls, unverifiedFigures } from "../../domain/draft-checks.js";
import { verifyEvidence, verifyReasons } from "../../domain/evidence.js";
import type { AuditRepository } from "../audit/audit.repository.js";
import type { TraceStep } from "../agent/agent.types.js";
import type { DetectiveAgent } from "../agent/detective-agent.js";
import type { InterventionsRepository } from "../interventions/interventions.repository.js";
import { RecoveryAction } from "../interventions/interventions.types.js";
import type { LeadsService } from "../leads/leads.service.js";
import type { Lead } from "../leads/leads.types.js";
import type { MessagesRepository } from "../messages/messages.repository.js";
import type { ResourcesRepository } from "../resources/resources.repository.js";
import type { InvestigationsRepository } from "./investigations.repository.js";
import type { Investigation, InvestigationOutcome, InvestigationResult } from "./investigations.types.js";

const SYSTEM_ACTOR = "System";

export interface InvestigationsServiceDeps {
    leads: LeadsService;
    messages: MessagesRepository;
    resources: ResourcesRepository;
    investigations: InvestigationsRepository;
    interventions: InterventionsRepository;
    audit: AuditRepository;
    transactions: Transactional;
    agent: DetectiveAgent;
}

export class InvestigationsService {
    constructor(private readonly deps: InvestigationsServiceDeps) {}

    /** Throws unless the lead exists, may be contacted, and has no draft already waiting for approval. */
    async assertInvestigable(leadId: string): Promise<Lead> {
        const lead = await this.deps.leads.getById(leadId);
        const contact = await this.deps.leads.checkContactability(lead);
        if (!contact.ok) throw new ConflictError("This lead is protected from outreach", contact.reasons);
        if (await this.deps.interventions.findPendingForLead(leadId)) {
            throw new ConflictError("A recovery message is already waiting for approval");
        }
        return lead;
    }

    /** Guards, runs the agent, verifies its claims against the transcript, then stores a draft awaiting approval. */
    async investigate(leadId: string, onStep?: (step: TraceStep) => void): Promise<InvestigationOutcome> {
        const lead = await this.assertInvestigable(leadId);
        const transcript = await this.deps.messages.findByLead(leadId);
        const run = await this.deps.agent.run(lead, transcript, onStep);
        const out = run.output;

        const stallReasons = verifyReasons(out, transcript);
        const unmetRequests = out.unmetRequests.map((u) => ({
            request: u.request,
            evidence: verifyEvidence(u.evidence, transcript),
        }));

        const wanted = unique(out.recommendation.resourceIds);
        const known = await this.deps.resources.findByIds(wanted);
        const cited = wanted.flatMap((id) => known.filter((r) => r.id === id));
        const unknownIds = wanted.filter((id) => !cited.some((r) => r.id === id));

        const result: InvestigationResult = {
            summary: out.summary,
            stallReasons,
            unmetRequests,
            recommendation: { ...out.recommendation, resourceIds: cited.map((r) => r.id) },
            draft: out.draft,
            confidence: out.confidence,
        };
        const investigation: Investigation = {
            id: newId("inv"),
            leadId,
            result,
            trace: run.trace,
            model: run.model,
            durationMs: run.durationMs,
            createdAt: nowIso(),
        };

        const warnings: string[] = [];
        if (unknownIds.length) warnings.push(`Agent cited unknown resource ids (ignored): ${unknownIds.join(", ")}`);
        const links = strayUrls(out.draft.body);
        if (links.length) warnings.push(`Draft contained unverified links: ${links.join(", ")}`);
        const figures = unverifiedFigures(out.draft.body, cited, transcript);
        if (figures.length) {
            warnings.push(`Figures not found in verified resources: ${figures.join(", ")}. Check before approving.`);
        }
        const downgraded = stallReasons.filter((r) => r.downgraded).length;
        if (downgraded) {
            warnings.push(
                `${downgraded} claimed reason(s) had no verifiable evidence and were downgraded to "possible".`,
            );
        }

        const hasDraft = out.recommendation.action !== RecoveryAction.no_action && out.draft.body.trim().length > 0;
        const linkBlock = cited.length
            ? `\n\nHelpful links:\n${cited.map((r) => `- ${r.title}: ${r.url}`).join("\n")}`
            : "";
        const primary = stallReasons.find((r) => r.status === "confirmed") ?? stallReasons[0];

        const intervention = await this.deps.transactions.transaction(async () => {
            await this.deps.investigations.create(investigation);
            await this.deps.audit.log({
                leadId,
                actor: SYSTEM_ACTOR,
                action: "investigated",
                detail: out.recommendation.action,
            });
            if (!hasDraft) return null;

            const draft = await this.deps.interventions.create({
                leadId,
                investigationId: investigation.id,
                action: out.recommendation.action,
                primaryCategory: primary?.category ?? null,
                draftSubject: out.draft.subject.trim(),
                draftBody: `${out.draft.body.trim()}${linkBlock}`,
                resourceIds: cited.map((r) => r.id),
                warnings,
            });
            await this.deps.audit.log({
                leadId,
                interventionId: draft.id,
                actor: SYSTEM_ACTOR,
                action: "draft_created",
                detail: "Waiting for counsellor approval",
            });
            return draft;
        });

        return { investigation, intervention };
    }
}
