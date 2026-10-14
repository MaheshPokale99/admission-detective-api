import type { BusinessRules } from "../../src/domain/business-rules.js";
import type { InterventionWithOutcomes } from "../../src/modules/interventions/interventions.types.js";
import type { Lead } from "../../src/modules/leads/leads.types.js";
import type { Message } from "../../src/modules/messages/messages.types.js";
import type { Outcome } from "../../src/modules/outcomes/outcomes.types.js";

export const RULES: BusinessRules = { stallThresholdDays: 5, contactCooldownDays: 3 };

export const NOW = Date.parse("2026-10-14T12:00:00Z");
export const daysAgo = (days: number) => new Date(NOW - days * 86_400_000).toISOString();

export const makeLead = (overrides: Partial<Lead> = {}): Lead => ({
    id: "lead_1",
    name: "Test Lead",
    email: "test@example.com",
    phone: "",
    city: "",
    program: "B.Tech",
    stage: "counselled",
    consent: "opted_in",
    consentNote: "",
    eligibility: "eligible",
    ineligibleReason: "",
    counsellor: "Neha",
    source: "web",
    createdAt: daysAgo(20),
    lastActivityAt: daysAgo(8),
    ...overrides,
});

export const makeMessage = (overrides: Partial<Message> = {}): Message => ({
    id: "m_1",
    leadId: "lead_1",
    channel: "whatsapp",
    direction: "inbound",
    author: "Test Lead",
    body: "Hello",
    sentAt: daysAgo(8),
    ...overrides,
});

export const makeOutcome = (overrides: Partial<Outcome> = {}): Outcome => ({
    id: "out_1",
    interventionId: "int_1",
    leadId: "lead_1",
    type: "replied",
    note: "",
    createdAt: daysAgo(1),
    ...overrides,
});

export const makeIntervention = (overrides: Partial<InterventionWithOutcomes> = {}): InterventionWithOutcomes => ({
    id: "int_1",
    leadId: "lead_1",
    investigationId: null,
    channel: "email",
    status: "sent",
    action: "send_fee_resource",
    primaryCategory: "fees",
    draftSubject: "s",
    draftBody: "b",
    finalSubject: "s",
    finalBody: "b",
    edited: false,
    resourceIds: [],
    warnings: [],
    reviewedBy: "Neha",
    reviewedAt: daysAgo(2),
    rejectionReason: null,
    sentAt: daysAgo(2),
    provider: "simulated",
    providerMessageId: null,
    error: null,
    createdAt: daysAgo(3),
    outcomes: [],
    ...overrides,
});
