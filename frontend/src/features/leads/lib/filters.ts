import type { LeadStatus, LeadSummary } from "@/lib/api";

export const LEAD_FILTERS = [
    { id: "ready", label: "Ready", statuses: ["ready"] },
    { id: "flight", label: "In flight", statuses: ["awaiting_approval", "contacted"] },
    { id: "protected", label: "Protected", statuses: ["protected"] },
    { id: "recovered", label: "Recovered", statuses: ["recovered"] },
    { id: "all", label: "All", statuses: null },
] as const satisfies readonly { id: string; label: string; statuses: readonly LeadStatus[] | null }[];

export type LeadFilterId = (typeof LEAD_FILTERS)[number]["id"];

export function matchesFilter(lead: LeadSummary, id: LeadFilterId): boolean {
    const statuses = LEAD_FILTERS.find((f) => f.id === id)?.statuses;
    return !statuses || (statuses as readonly LeadStatus[]).includes(lead.status);
}

export function matchesQuery(lead: LeadSummary, query: string): boolean {
    const q = query.trim().toLowerCase();
    return !q || `${lead.name} ${lead.city} ${lead.counsellor} ${lead.email}`.toLowerCase().includes(q);
}

export const byPotential = (a: LeadSummary, b: LeadSummary) =>
    b.recoveryScore - a.recoveryScore || b.daysInactive - a.daysInactive;
