import { ConflictError } from "../../common/errors/app-error.js";
import { newId } from "../../common/utils/ids.js";
import { nowIso } from "../../common/utils/time.js";
import { isUniqueViolation, type Database } from "../../database/database.js";
import type { Intervention as InterventionRow, Outcome as OutcomeRow } from "../../generated/prisma/client.js";
import type { Outcome } from "../outcomes/outcomes.types.js";
import {
    InterventionStatus,
    type Intervention,
    type InterventionWithOutcomes,
    type NewIntervention,
} from "./interventions.types.js";

const toIntervention = (row: InterventionRow): Intervention => ({
    ...row,
    channel: "email",
    reviewedAt: row.reviewedAt?.toISOString() ?? null,
    sentAt: row.sentAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
});

const toOutcome = (row: OutcomeRow): Outcome => ({ ...row, createdAt: row.createdAt.toISOString() });

export interface InterventionFilter {
    status?: InterventionStatus;
    leadIds?: string[] | null;
}

export class InterventionsRepository {
    constructor(private readonly database: Database) {}

    async list(filter: InterventionFilter = {}): Promise<InterventionWithOutcomes[]> {
        const rows = await this.database.client.intervention.findMany({
            where: { status: filter.status, leadId: filter.leadIds ? { in: filter.leadIds } : undefined },
            orderBy: { createdAt: "desc" },
            include: { outcomes: { orderBy: { createdAt: "asc" } } },
        });
        return rows.map(({ outcomes, ...row }) => ({ ...toIntervention(row), outcomes: outcomes.map(toOutcome) }));
    }

    async findById(id: string): Promise<Intervention | undefined> {
        const row = await this.database.client.intervention.findUnique({ where: { id } });
        return row ? toIntervention(row) : undefined;
    }

    async findPendingForLead(leadId: string): Promise<Intervention | undefined> {
        const row = await this.database.client.intervention.findFirst({
            where: { leadId, status: InterventionStatus.pending_approval },
        });
        return row ? toIntervention(row) : undefined;
    }

    async findLastSentAt(leadId: string): Promise<string | undefined> {
        const { _max } = await this.database.client.intervention.aggregate({
            where: { leadId, status: InterventionStatus.sent },
            _max: { sentAt: true },
        });
        return _max.sentAt?.toISOString();
    }

    /** Creates a draft; the database allows only one pending draft per lead. */
    async create(input: NewIntervention, createdAt = nowIso()): Promise<Intervention> {
        try {
            const row = await this.database.client.intervention.create({
                data: {
                    id: newId("int"),
                    status: InterventionStatus.pending_approval,
                    ...input,
                    createdAt: new Date(createdAt),
                },
            });
            return toIntervention(row);
        } catch (error) {
            if (isUniqueViolation(error)) throw new ConflictError("A recovery message is already waiting for approval");
            throw error;
        }
    }

    async reject(id: string, reviewer: string, reason: string): Promise<Intervention | undefined> {
        const { count } = await this.database.client.intervention.updateMany({
            where: { id, status: InterventionStatus.pending_approval },
            data: {
                status: InterventionStatus.rejected,
                reviewedBy: reviewer,
                reviewedAt: new Date(),
                rejectionReason: reason,
            },
        });
        return count ? this.findById(id) : undefined;
    }

    /** Atomically claims a pending or failed draft for sending; returns nothing if another request got there first. */
    async claimForSending(
        id: string,
        reviewer: string,
        subject: string,
        body: string,
        edited: boolean,
    ): Promise<Intervention | undefined> {
        const { count } = await this.database.client.intervention.updateMany({
            where: { id, status: { in: [InterventionStatus.pending_approval, InterventionStatus.failed] } },
            data: {
                status: InterventionStatus.approved,
                reviewedBy: reviewer,
                reviewedAt: new Date(),
                finalSubject: subject,
                finalBody: body,
                edited,
                error: null,
            },
        });
        return count ? this.findById(id) : undefined;
    }

    async markSent(id: string, provider: string, providerMessageId: string | null): Promise<void> {
        await this.database.client.intervention.update({
            where: { id },
            data: { status: InterventionStatus.sent, sentAt: new Date(), provider, providerMessageId, error: null },
        });
    }

    async markFailed(id: string, error: string): Promise<void> {
        await this.database.client.intervention.update({
            where: { id },
            data: { status: InterventionStatus.failed, error },
        });
    }
}
