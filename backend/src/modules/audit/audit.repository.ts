import type { Database } from "../../database/database.js";
import type { AuditLog as AuditRow } from "../../generated/prisma/client.js";
import { nowIso } from "../../common/utils/time.js";
import type { AuditEntry, NewAuditEntry } from "./audit.types.js";

const toAuditEntry = (row: AuditRow): AuditEntry => ({ ...row, createdAt: row.createdAt.toISOString() });

export class AuditRepository {
    constructor(private readonly database: Database) {}

    async log(entry: NewAuditEntry, at = nowIso()): Promise<void> {
        await this.database.client.auditLog.create({
            data: {
                leadId: entry.leadId ?? null,
                interventionId: entry.interventionId ?? null,
                actor: entry.actor,
                action: entry.action,
                detail: entry.detail ?? "",
                createdAt: new Date(at),
            },
        });
    }

    async findByLead(leadId: string): Promise<AuditEntry[]> {
        const rows = await this.database.client.auditLog.findMany({ where: { leadId }, orderBy: { id: "desc" } });
        return rows.map(toAuditEntry);
    }
}
