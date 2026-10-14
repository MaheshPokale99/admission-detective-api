import { serve } from "@hono/node-server";
import { createApp } from "./app.js";
import { SHUTDOWN_TIMEOUT_MS } from "./common/constants.js";
import { createLogger } from "./common/logger/logger.js";
import { loadConfig } from "./config/env.js";
import { createContainer } from "./container.js";
import { isMissingTable } from "./database/database.js";
import { seedDatabase } from "./database/seed/seed.js";

const config = loadConfig();
const logger = createLogger(config);
const container = createContainer(config, logger);
const app = createApp(container);

async function prepareDatabase(): Promise<void> {
    try {
        if (config.demo.seedOnEmpty && (await container.repositories.leads.count()) === 0) {
            await seedDatabase(container.database, { reset: false });
            logger.info("Seeded demo data");
        } else {
            await container.database.ping();
        }
    } catch (error) {
        if (isMissingTable(error)) {
            logger.fatal(
                "The database is reachable but has no tables yet. Run `npm run db:migrate`, then start again.",
            );
        } else {
            logger.fatal(
                { err: error },
                "Cannot use the database. Check DATABASE_URL, DATABASE_SSL and that it is running.",
            );
        }
        process.exit(1);
    }
}

logger.info("Connecting to the database...");
await prepareDatabase();
logger.info("Database ready");

const server = serve({ fetch: app.fetch, port: config.port }, (info) => {
    logger.info(
        {
            url: `http://localhost:${info.port}`,
            env: config.env,
            gemini: config.gemini.enabled ? config.gemini.model : "not configured",
            emailProvider: config.email.provider,
            logFile: config.logFile ?? "console only",
        },
        `Server started on http://localhost:${info.port}`,
    );
});

server.on("error", (error: NodeJS.ErrnoException) => {
    const message =
        error.code === "EADDRINUSE"
            ? `Port ${config.port} is already in use. Stop the other process or change PORT in .env.`
            : "The server could not start listening";
    logger.fatal({ err: error }, message);
    process.exit(1);
});

if (!config.gemini.enabled) logger.warn("GEMINI_API_KEY is not set: investigations are disabled");

container.emailSender
    .verify?.()
    .then(() => logger.info({ emailProvider: config.email.provider }, "Email provider connection verified"))
    .catch((err: unknown) => {
        const loginRejected = (err as { code?: string }).code === "EAUTH";
        logger.warn(
            { err },
            loginRejected
                ? "SMTP login was rejected. For Gmail use your full address as SMTP_USER and the 16-character App Password as SMTP_PASS."
                : "Email provider check failed; sends will fail until this is fixed",
        );
    });

let shuttingDown = false;

async function shutdown(reason: string, exitCode = 0): Promise<void> {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info({ reason }, "Shutting down");

    const forced = setTimeout(() => {
        logger.error("Shutdown timed out, forcing exit");
        process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS);
    forced.unref();

    server.close();
    await container.database.disconnect();
    process.exit(exitCode);
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("unhandledRejection", (err) => {
    logger.fatal({ err }, "Unhandled promise rejection");
    void shutdown("unhandledRejection", 1);
});
process.on("uncaughtException", (err) => {
    logger.fatal({ err }, "Uncaught exception");
    void shutdown("uncaughtException", 1);
});
