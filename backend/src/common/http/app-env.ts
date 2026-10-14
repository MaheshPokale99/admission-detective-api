import type { Logger } from "../logger/logger.js";

export interface AppEnv {
    Variables: {
        requestId: string;
        logger: Logger;
    };
}
