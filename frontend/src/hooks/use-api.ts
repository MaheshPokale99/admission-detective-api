"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type Intervention } from "@/lib/api";

const queryKeys = {
    health: ["health"] as const,
    leads: ["leads"] as const,
    lead: (id: string) => ["lead", id] as const,
    metrics: ["metrics"] as const,
    interventions: (status?: Intervention["status"]) => ["interventions", status ?? "all"] as const,
};

export const useHealth = () => useQuery({ queryKey: queryKeys.health, queryFn: api.health, staleTime: 60_000 });
export const useLeads = () => useQuery({ queryKey: queryKeys.leads, queryFn: api.leads });
export const useLead = (id: string) => useQuery({ queryKey: queryKeys.lead(id), queryFn: () => api.lead(id) });
export const useMetrics = () => useQuery({ queryKey: queryKeys.metrics, queryFn: api.metrics });
export const useInterventions = (status?: Intervention["status"]) =>
    useQuery({ queryKey: queryKeys.interventions(status), queryFn: () => api.interventions(status) });

/** Every screen derives from the same records, so after any write we refresh all of them. */
export function useRefreshAll() {
    const qc = useQueryClient();
    return () => qc.invalidateQueries({ predicate: (q) => q.queryKey[0] !== "health" });
}
