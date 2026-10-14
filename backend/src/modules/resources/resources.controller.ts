import type { Context } from "hono";
import type { AppEnv } from "../../common/http/app-env.js";
import type { ResourcesService } from "./resources.service.js";

export class ResourcesController {
    constructor(private readonly service: ResourcesService) {}

    list = async (c: Context<AppEnv>) => c.json(await this.service.list());
}
