import type { Database } from "../../database/database.js";
import type { Investigation as InvestigationRow, Prisma } from "../../generated/prisma/client.js";
import type { TraceStep } from "../agent/agent.types.js";
import type { Investigation, InvestigationResult } from "./investigations.types.js";

const toInvestigation = (row: InvestigationRow): Investigation => ({
    ...row,
    result: row.result as unknown as InvestigationResult,
    trace: row.trace as unknown as TraceStep[],
    createdAt: row.createdAt.toISOString(),
});

const asJson = (value: unknown) => value as Prisma.InputJsonValue;

export class InvestigationsRepository {
    constructor(private readonly database: Database) {}

    async findByLead(leadId: string): Promise<Investigation[]> {
        const rows = await this.database.client.investigation.findMany({
            where: { leadId },
            orderBy: { createdAt: "desc" },
        });
        return rows.map(toInvestigation);
    }

    /** Ids of leads that have at least one investigation; pass null for every lead. */
    async findInvestigatedLeadIds(leadIds: string[] | null): Promise<Set<string>> {
        const rows = await this.database.client.investigation.findMany({
            where: { leadId: leadIds ? { in: leadIds } : undefined },
            select: { leadId: true },
            distinct: ["leadId"],
        });
        return new Set(rows.map((r) => r.leadId));
    }

    async create(investigation: Investigation): Promise<void> {
        await this.database.client.investigation.create({
            data: {
                ...investigation,
                result: asJson(investigation.result),
                trace: asJson(investigation.trace),
                createdAt: new Date(investigation.createdAt),
            },
        });
    }
}
