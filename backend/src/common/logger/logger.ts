import { pino, type Logger, type TransportTargetOptions } from "pino";
import type { AppConfig } from "../../config/env.js";

export type { Logger };

const STDOUT = 1;

/**
 * Structured logger. Console output is pretty in development and JSON otherwise; when LOG_FILE is set the same
 * records are also appended to that file as JSON lines. PII fields are redacted everywhere.
 */
export function createLogger(config: Pick<AppConfig, "env" | "logLevel" | "logFile">): Logger {
    const quiet = config.env === "test";
    const level = quiet && !config.logFile ? "silent" : config.logLevel;
    const redact = {
        paths: ["email", "phone", "*.email", "*.phone", "req.headers.authorization", "req.headers.cookie"],
        censor: "[redacted]",
    };

    const targets: TransportTargetOptions[] = [];
    if (!quiet) {
        targets.push(
            config.env === "development"
                ? {
                      target: "pino-pretty",
                      level,
                      options: { colorize: true, translateTime: "SYS:HH:MM:ss", ignore: "pid,hostname" },
                  }
                : { target: "pino/file", level, options: { destination: STDOUT } },
        );
    }
    if (config.logFile) {
        targets.push({ target: "pino/file", level, options: { destination: config.logFile, mkdir: true } });
    }

    return pino({ level, redact }, targets.length > 0 ? pino.transport({ targets }) : undefined);
}
