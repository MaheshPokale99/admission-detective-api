import type { Database } from "../../database/database.js";
import type { Resource as ResourceRow } from "../../generated/prisma/client.js";
import type { Resource } from "./resources.types.js";

const toResource = (row: ResourceRow): Resource => ({ ...row, verifiedAt: row.verifiedAt.toISOString() });

export class ResourcesRepository {
    constructor(private readonly database: Database) {}

    async findAll(): Promise<Resource[]> {
        const rows = await this.database.client.resource.findMany({
            orderBy: [{ category: "asc" }, { title: "asc" }],
        });
        return rows.map(toResource);
    }

    async findByIds(ids: string[]): Promise<Resource[]> {
        const rows = await this.database.client.resource.findMany({ where: { id: { in: ids } } });
        return rows.map(toResource);
    }
}
