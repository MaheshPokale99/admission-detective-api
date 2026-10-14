import type { Context } from "hono";
import type { AppEnv } from "../../common/http/app-env.js";
import { parseParams } from "../../common/http/request.js";
import { idParams } from "../../common/http/schemas.js";
import type { LeadsService } from "./leads.service.js";

export class LeadsController {
    constructor(private readonly service: LeadsService) {}

    list = async (c: Context<AppEnv>) => c.json(await this.service.list());

    detail = async (c: Context<AppEnv>) => c.json(await this.service.detail(parseParams(c, idParams).id));
}
