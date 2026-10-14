import type { Context } from "hono";
import { streamSSE } from "hono/streaming";
import { AppError } from "../../common/errors/app-error.js";
import type { AppEnv } from "../../common/http/app-env.js";
import { parseParams } from "../../common/http/request.js";
import { idParams } from "../../common/http/schemas.js";
import type { InvestigationsService } from "./investigations.service.js";

export class InvestigationsController {
    constructor(private readonly service: InvestigationsService) {}

    /** Runs the agent and streams `step`, `result` and `error` server-sent events. */
    investigate = async (c: Context<AppEnv>) => {
        const { id } = parseParams(c, idParams);
        await this.service.assertInvestigable(id);
        const logger = c.get("logger");

        return streamSSE(c, async (stream) => {
            try {
                const outcome = await this.service.investigate(id, (step) => {
                    void stream.writeSSE({ event: "step", data: JSON.stringify(step) });
                });
                await stream.writeSSE({ event: "result", data: JSON.stringify(outcome) });
            } catch (error) {
                const known = error instanceof AppError;
                if (!known) logger.error({ err: error }, "investigation failed");
                const payload = known
                    ? { code: error.code, message: error.message }
                    : { code: "INTERNAL_ERROR", message: "Investigation failed" };
                await stream.writeSSE({ event: "error", data: JSON.stringify({ error: payload }) });
            }
        });
    };
}
