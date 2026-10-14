import type { Context } from "hono";
import type { AppEnv } from "../../common/http/app-env.js";
import type { SystemService } from "./system.service.js";

export class SystemController {
    constructor(private readonly service: SystemService) {}

    status = (c: Context<AppEnv>) => c.json(this.service.status());

    live = (c: Context<AppEnv>) => c.json({ status: "alive" });

    ready = async (c: Context<AppEnv>) => {
        await this.service.assertReady();
        return c.json({ status: "ready" });
    };

    resetDemoData = async (c: Context<AppEnv>) => {
        await this.service.resetDemoData();
        return c.json({ ok: true });
    };
}
