export interface AuditEntry {
    id: number;
    leadId: string | null;
    interventionId: string | null;
    actor: string;
    action: string;
    detail: string;
    createdAt: string;
}

export interface NewAuditEntry {
    leadId?: string;
    interventionId?: string;
    actor: string;
    action: string;
    detail?: string;
}
