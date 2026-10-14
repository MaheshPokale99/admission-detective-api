import { post, request } from "./client";
import type { Health, Intervention, InterventionRow, LeadDetail, LeadSummary, Metrics, OutcomeType } from "./types";

export const api = {
    health: () => request<Health>("/health"),
    leads: () => request<LeadSummary[]>("/leads"),
    lead: (id: string) => request<LeadDetail>(`/leads/${id}`),
    interventions: (status?: Intervention["status"]) =>
        request<InterventionRow[]>(`/interventions${status ? `?status=${status}` : ""}`),
    metrics: () => request<Metrics>("/metrics"),
    approve: (id: string, b: { reviewer: string; subject: string; body: string }) =>
        post<Intervention>(`/interventions/${id}/approve`, b),
    reject: (id: string, b: { reviewer: string; reason: string }) =>
        post<Intervention>(`/interventions/${id}/reject`, b),
    recordOutcome: (id: string, b: { type: OutcomeType; note: string }) =>
        post<{ ok: true }>(`/interventions/${id}/outcomes`, b),
    reset: () => post<{ ok: true }>("/admin/reset"),
};
