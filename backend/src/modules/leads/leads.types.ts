import { LeadStage, type Consent, type Eligibility } from "../../generated/prisma/enums.js";

export { Consent, Eligibility, LeadStage } from "../../generated/prisma/enums.js";

export const STAGE_ORDER: readonly LeadStage[] = [
    LeadStage.enquiry,
    LeadStage.counselled,
    LeadStage.shortlisted,
    LeadStage.applied,
    LeadStage.admitted,
    LeadStage.lost,
];

export const TERMINAL_STAGES: readonly LeadStage[] = [LeadStage.admitted, LeadStage.lost];

export interface Lead {
    id: string;
    name: string;
    email: string;
    phone: string;
    city: string;
    program: string;
    stage: LeadStage;
    consent: Consent;
    consentNote: string;
    eligibility: Eligibility;
    ineligibleReason: string;
    counsellor: string;
    source: string;
    createdAt: string;
    lastActivityAt: string;
}

export type LeadStatus = "protected" | "ready" | "awaiting_approval" | "contacted" | "recovered" | "active" | "closed";

export interface LeadSummary extends Lead {
    daysInactive: number;
    stalled: boolean;
    recoveryScore: number;
    status: LeadStatus;
    contactable: boolean;
    protectedReasons: string[];
    investigated: boolean;
    pendingInterventionId: string | null;
    lastMessage: { channel: string; direction: string; preview: string } | null;
}
