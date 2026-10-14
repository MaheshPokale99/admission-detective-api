import type { InterventionStatus, ReasonCategory, RecoveryAction } from "../../generated/prisma/enums.js";
import type { Outcome } from "../outcomes/outcomes.types.js";

export { InterventionStatus, ReasonCategory, RecoveryAction } from "../../generated/prisma/enums.js";

export interface Intervention {
    id: string;
    leadId: string;
    investigationId: string | null;
    channel: "email";
    status: InterventionStatus;
    action: RecoveryAction;
    primaryCategory: ReasonCategory | null;
    draftSubject: string;
    draftBody: string;
    finalSubject: string | null;
    finalBody: string | null;
    edited: boolean;
    resourceIds: string[];
    warnings: string[];
    reviewedBy: string | null;
    reviewedAt: string | null;
    rejectionReason: string | null;
    sentAt: string | null;
    provider: string | null;
    providerMessageId: string | null;
    error: string | null;
    createdAt: string;
}

export interface InterventionWithOutcomes extends Intervention {
    outcomes: Outcome[];
}

export interface NewIntervention {
    leadId: string;
    investigationId: string | null;
    action: RecoveryAction;
    primaryCategory: ReasonCategory | null;
    draftSubject: string;
    draftBody: string;
    resourceIds: string[];
    warnings: string[];
}
