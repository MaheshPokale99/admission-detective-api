import type { Database } from "../../database/database.js";
import type { Lead as LeadRow } from "../../generated/prisma/client.js";
import type { Consent, Lead, LeadStage } from "./leads.types.js";

const toLead = (row: LeadRow): Lead => ({
    ...row,
    createdAt: row.createdAt.toISOString(),
    lastActivityAt: row.lastActivityAt.toISOString(),
});

export class LeadsRepository {
    constructor(private readonly database: Database) {}

    async findAll(): Promise<Lead[]> {
        const rows = await this.database.client.lead.findMany({ orderBy: { lastActivityAt: "asc" } });
        return rows.map(toLead);
    }

    async findById(id: string): Promise<Lead | undefined> {
        const row = await this.database.client.lead.findUnique({ where: { id } });
        return row ? toLead(row) : undefined;
    }

    async updateStage(id: string, stage: LeadStage): Promise<void> {
        await this.database.client.lead.update({ where: { id }, data: { stage } });
    }

    async touch(id: string, at: string): Promise<void> {
        await this.database.client.lead.update({ where: { id }, data: { lastActivityAt: new Date(at) } });
    }

    async updateConsent(id: string, consent: Consent, consentNote: string): Promise<void> {
        await this.database.client.lead.update({ where: { id }, data: { consent, consentNote } });
    }

    count(): Promise<number> {
        return this.database.client.lead.count();
    }
}
