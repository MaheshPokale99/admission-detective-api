import { createServer } from "node:net";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import type { Content, GenerateContentResponse } from "@google/genai";
import { migrationSql } from "../../scripts/migrations.js";
import { createApp } from "../../src/app.js";
import { createLogger } from "../../src/common/logger/logger.js";
import { loadConfig } from "../../src/config/env.js";
import { createContainer, type ContainerOverrides } from "../../src/container.js";
import { Database } from "../../src/database/database.js";
import { seedDatabase } from "../../src/database/seed/seed.js";
import type { GenerateFn } from "../../src/modules/agent/agent.types.js";

const freePort = () =>
    new Promise<number>((resolve) => {
        const probe = createServer().listen(0, "127.0.0.1", () => {
            const { port } = probe.address() as { port: number };
            probe.close(() => resolve(port));
        });
    });

export interface TestStack {
    database: Database;
    databaseUrl: string;
    /** Builds another app over the same database, e.g. with different config or a different model. */
    createApp: (env?: Record<string, string>, overrides?: ContainerOverrides) => ReturnType<typeof buildApp>;
    app: ReturnType<typeof buildApp>["app"];
    container: ReturnType<typeof buildApp>["container"];
    reseed: () => Promise<void>;
    stop: () => Promise<void>;
}

function buildApp(database: Database, databaseUrl: string, env: Record<string, string>, overrides: ContainerOverrides) {
    const config = loadConfig({ NODE_ENV: "test", DATABASE_URL: databaseUrl, GEMINI_API_KEY: "test-key", ...env });
    const container = createContainer(config, createLogger(config), { database, ...overrides });
    return { app: createApp(container), container, config };
}

/** Starts an in-memory Postgres (PGlite), applies the Prisma migrations and builds the real application on it. */
export async function createTestStack(
    env: Record<string, string> = {},
    overrides: ContainerOverrides = {},
): Promise<TestStack> {
    const pglite = await PGlite.create();
    for (const script of migrationSql()) await pglite.exec(script);
    const port = await freePort();
    const socket = new PGLiteSocketServer({ db: pglite, port, host: "127.0.0.1", maxConnections: 10 });
    await socket.start();

    const databaseUrl = `postgresql://postgres:postgres@127.0.0.1:${port}/detective`;
    const database = Database.create({ url: databaseUrl, ssl: false, poolMax: 5 });
    const built = buildApp(database, databaseUrl, env, overrides);
    await seedDatabase(database, { reset: true });

    return {
        database,
        databaseUrl,
        app: built.app,
        container: built.container,
        createApp: (extraEnv = {}, extraOverrides = {}) =>
            buildApp(database, databaseUrl, { ...env, ...extraEnv }, { ...overrides, ...extraOverrides }),
        reseed: () => seedDatabase(database, { reset: true }),
        stop: async () => {
            await database.disconnect();
            await socket.stop();
            await pglite.close();
        },
    };
}

export interface ScriptedCall {
    name: string;
    args: Record<string, unknown>;
}

/** A fake Gemini: each entry is the function call(s) the model makes on that turn. */
export function scriptedModel(turns: ScriptedCall[][]) {
    let i = 0;
    const seen: Content[][] = [];
    const generate: GenerateFn = async (contents) => {
        seen.push(structuredClone(contents));
        const calls = turns[i++] ?? [];
        return {
            functionCalls: calls.map((c) => ({ name: c.name, args: c.args })),
            candidates: [
                {
                    content: {
                        role: "model",
                        parts: calls.map((c) => ({ functionCall: { name: c.name, args: c.args } })),
                    },
                },
            ],
        } as unknown as GenerateContentResponse;
    };
    return { generate, seen };
}

export const fullInvestigation = (submission: Record<string, unknown>): ScriptedCall[][] => [
    [{ name: "get_lead_profile", args: {} }],
    [{ name: "get_conversation_history", args: {} }],
    [{ name: "search_verified_resources", args: { query: "fees emi" } }],
    [{ name: "get_past_intervention_results", args: {} }],
    [{ name: "submit_investigation", args: submission }],
];

export const rahulSubmission = (overrides: Record<string, unknown> = {}) => ({
    summary: "Rahul wanted fee details to discuss with his father and never received them.",
    stallReasons: [
        {
            category: "parent_approval",
            status: "confirmed",
            statement: "Rahul needs his parents' agreement on fees.",
            evidence: [{ messageId: "m_rahul_2", quote: "I need to discuss the fees with my parents" }],
            reasoning: "Stated explicitly on the call.",
        },
        {
            category: "competitor",
            status: "confirmed",
            statement: "He is choosing another college.",
            evidence: [{ messageId: "m_rahul_3", quote: "I have already joined another college" }],
            reasoning: "Made up by the model.",
        },
    ],
    unmetRequests: [
        {
            request: "Fee breakup and EMI options",
            evidence: { messageId: "m_rahul_3", quote: "Can you send the fee breakup and EMI options?" },
        },
    ],
    recommendation: {
        action: "send_fee_resource",
        rationale: "He asked for exactly this.",
        resourceIds: ["res_fees", "res_emi", "res_does_not_exist"],
    },
    draft: {
        subject: "The fee details you asked for",
        body: "Hi Rahul,\n\nYou mentioned discussing fees with your parents. Tuition is ₹2,40,000 a year and EMI runs 12 to 36 months. A scholarship of 90% is also possible.\n\nNeha, NIAT Admissions",
    },
    confidence: "high",
    ...overrides,
});

export const simpleSubmission = (overrides: Record<string, unknown> = {}) =>
    rahulSubmission({
        stallReasons: [
            { category: "course_clarity", status: "possible", statement: "s", evidence: [], reasoning: "r" },
        ],
        unmetRequests: [],
        ...overrides,
    });
