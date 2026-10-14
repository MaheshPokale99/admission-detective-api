import type { Context } from "hono";
import type { AppEnv } from "../../common/http/app-env.js";
import { parseBody, parseParams } from "../../common/http/request.js";
import { idParams } from "../../common/http/schemas.js";
import { recordOutcomeBody } from "./outcomes.schema.js";
import type { OutcomesService } from "./outcomes.service.js";

export class OutcomesController {
    constructor(private readonly service: OutcomesService) {}

    record = async (c: Context<AppEnv>) => {
        const { id } = parseParams(c, idParams);
        const { type, note } = await parseBody(c, recordOutcomeBody);
        await this.service.record(id, type, note);
        return c.json({ ok: true });
    };
}
