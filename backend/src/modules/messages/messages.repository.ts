import type { Database } from "../../database/database.js";
import type { Message as MessageRow } from "../../generated/prisma/client.js";
import type { Message } from "./messages.types.js";

const toMessage = (row: MessageRow): Message => ({ ...row, sentAt: row.sentAt.toISOString() });

export class MessagesRepository {
    constructor(private readonly database: Database) {}

    async findByLead(leadId: string): Promise<Message[]> {
        const rows = await this.database.client.message.findMany({ where: { leadId }, orderBy: { sentAt: "asc" } });
        return rows.map(toMessage);
    }

    /** Newest message per lead; pass null for every lead. */
    async findLatestByLeads(leadIds: string[] | null): Promise<Message[]> {
        const rows = await this.database.client.message.findMany({
            where: { leadId: leadIds ? { in: leadIds } : undefined },
            orderBy: { sentAt: "desc" },
            distinct: ["leadId"],
        });
        return rows.map(toMessage);
    }

    async create(message: Message): Promise<void> {
        await this.database.client.message.create({ data: { ...message, sentAt: new Date(message.sentAt) } });
    }
}
