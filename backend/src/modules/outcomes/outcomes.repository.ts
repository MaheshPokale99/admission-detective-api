import { newId } from "../../common/utils/ids.js";
import { nowIso } from "../../common/utils/time.js";
import type { Database } from "../../database/database.js";
import type { NewOutcome } from "./outcomes.types.js";

export class OutcomesRepository {
    constructor(private readonly database: Database) {}

    async create(outcome: NewOutcome, createdAt = nowIso()): Promise<string> {
        const id = newId("out");
        await this.database.client.outcome.create({ data: { id, ...outcome, createdAt: new Date(createdAt) } });
        return id;
    }
}
