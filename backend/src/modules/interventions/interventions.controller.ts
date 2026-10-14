import type { Context } from "hono";
import type { AppEnv } from "../../common/http/app-env.js";
import { parseBody, parseParams, parseQuery } from "../../common/http/request.js";
import { idParams } from "../../common/http/schemas.js";
import { approveInterventionBody, listInterventionsQuery, rejectInterventionBody } from "./interventions.schema.js";
import type { InterventionsService } from "./interventions.service.js";

export class InterventionsController {
    constructor(private readonly service: InterventionsService) {}

    list = async (c: Context<AppEnv>) => c.json(await this.service.list(parseQuery(c, listInterventionsQuery).status));

    approve = async (c: Context<AppEnv>) => {
        const { id } = parseParams(c, idParams);
        const { reviewer, subject, body } = await parseBody(c, approveInterventionBody);
        return c.json(await this.service.approveAndSend(id, reviewer, subject, body));
    };

    reject = async (c: Context<AppEnv>) => {
        const { id } = parseParams(c, idParams);
        const { reviewer, reason } = await parseBody(c, rejectInterventionBody);
        return c.json(await this.service.reject(id, reviewer, reason));
    };
}
