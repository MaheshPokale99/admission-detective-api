export type Stage = "enquiry" | "counselled" | "shortlisted" | "applied" | "admitted" | "lost";
export type LeadStatus = "protected" | "ready" | "awaiting_approval" | "contacted" | "recovered" | "active" | "closed";
export type ReasonCategory =
    | "fees"
    | "parent_approval"
    | "course_clarity"
    | "missing_information"
    | "competitor"
    | "callback_missed"
    | "timing"
    | "other";
export type RecoveryAction =
    | "send_fee_resource"
    | "offer_parent_session"
    | "share_scholarship_info"
    | "share_curriculum_info"
    | "answer_pending_question"
    | "schedule_callback"
    | "no_action";
export type OutcomeType = "replied" | "session_booked" | "application_resumed" | "admitted" | "no_response";

export interface Lead {
    id: string;
    name: string;
    email: string;
    phone: string;
    city: string;
    program: string;
    stage: Stage;
    consent: "opted_in" | "opted_out" | "unknown";
    consentNote: string;
    eligibility: "eligible" | "ineligible";
    ineligibleReason: string;
    counsellor: string;
    source: string;
    createdAt: string;
    lastActivityAt: string;
}

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

export interface Message {
    id: string;
    leadId: string;
    channel: "form" | "call_note" | "whatsapp" | "email";
    direction: "inbound" | "outbound" | "internal";
    author: string;
    body: string;
    sentAt: string;
}

export interface Evidence {
    messageId: string;
    quote: string;
    verified: boolean;
}

export interface StallReason {
    category: ReasonCategory;
    status: "confirmed" | "possible";
    downgraded: boolean;
    statement: string;
    evidence: Evidence[];
    reasoning: string;
}

export interface InvestigationResult {
    summary: string;
    stallReasons: StallReason[];
    unmetRequests: { request: string; evidence: Evidence }[];
    recommendation: { action: RecoveryAction; rationale: string; resourceIds: string[] };
    draft: { subject: string; body: string };
    confidence: "low" | "medium" | "high";
}

export interface TraceStep {
    tool: string;
    label: string;
    summary: string;
    at: string;
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

export interface Outcome {
    id: string;
    interventionId: string;
    leadId: string;
    type: OutcomeType;
    note: string;
    createdAt: string;
}

export interface Intervention {
    id: string;
    leadId: string;
    investigationId: string | null;
    status: "pending_approval" | "approved" | "sent" | "rejected" | "failed";
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
    error: string | null;
    createdAt: string;
    outcomes: Outcome[];
}

export interface InterventionRow extends Intervention {
    lead: { id: string; name: string; stage: Stage; counsellor: string; email: string } | null;
}

export interface AuditEntry {
    id: number;
    actor: string;
    action: string;
    detail: string;
    createdAt: string;
}

export interface LeadDetail {
    lead: LeadSummary;
    messages: Message[];
    investigations: Investigation[];
    interventions: Intervention[];
    audit: AuditEntry[];
}

export interface Bucket {
    key: string;
    sent: number;
    recovered: number;
    admitted: number;
    recoveryRate: number;
}

export interface Metrics {
    funnel: { stage: Stage; count: number }[];
    totals: {
        leads: number;
        stalled: number;
        readyToInvestigate: number;
        protected: number;
        awaitingApproval: number;
        sent: number;
        recovered: number;
        admitted: number;
    };
    rates: { recoveryRate: number; admissionRate: number; approvalRate: number; editRate: number };
    byAction: Bucket[];
    byReason: Bucket[];
    safety: { protectedStalled: number; byReason: Record<string, number> };
    timeline: { date: string; sent: number; recovered: number }[];
}

export interface Health {
    ok: boolean;
    gemini: { configured: boolean; model: string };
    email: "smtp" | "resend" | "simulated";
    demoEndpoints: boolean;
}
