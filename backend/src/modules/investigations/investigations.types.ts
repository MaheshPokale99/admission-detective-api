import type { TraceStep } from "../agent/agent.types.js";
import type { InvestigationOutput } from "../agent/investigation-output.schema.js";
import type { Intervention, ReasonCategory } from "../interventions/interventions.types.js";

export interface VerifiedEvidence {
    messageId: string;
    quote: string;
    verified: boolean;
}

export interface VerifiedReason {
    category: ReasonCategory;
    status: "confirmed" | "possible";
    downgraded: boolean;
    statement: string;
    evidence: VerifiedEvidence[];
    reasoning: string;
}

export interface InvestigationResult {
    summary: string;
    stallReasons: VerifiedReason[];
    unmetRequests: { request: string; evidence: VerifiedEvidence }[];
    recommendation: InvestigationOutput["recommendation"];
    draft: InvestigationOutput["draft"];
    confidence: InvestigationOutput["confidence"];
}

export interface Investigation {
    id: string;
    leadId: string;
    result: InvestigationResult;
    trace: TraceStep[];
    model: string;
    durationMs: number;
    createdAt: string;
}

export interface InvestigationOutcome {
    investigation: Investigation;
    intervention: Intervention | null;
}
