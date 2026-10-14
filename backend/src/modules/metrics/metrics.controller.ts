import type { Context } from "hono";
import type { AppEnv } from "../../common/http/app-env.js";
import type { MetricsService } from "./metrics.service.js";

export class MetricsController {
    constructor(private readonly service: MetricsService) {}

    overview = async (c: Context<AppEnv>) => c.json(await this.service.overview());
}
