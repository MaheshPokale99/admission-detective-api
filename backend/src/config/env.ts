import "dotenv/config";
import { z } from "zod";

const flag = z.enum(["true", "false"]);

const schema = z.object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
    LOG_FILE: z.string().min(1).optional(),
    PORT: z.coerce.number().int().positive().default(8787),
    FRONTEND_ORIGIN: z.string().min(1).default("http://localhost:3000"),

    DATABASE_URL: z.string().min(1).default("postgresql://postgres:postgres@localhost:5432/detective"),
    DATABASE_SSL: flag.default("false"),
    DATABASE_POOL_MAX: z.coerce.number().int().positive().default(10),

    GEMINI_API_KEY: z.string().default(""),
    GEMINI_MODEL: z.string().min(1).default("gemini-3.8-flash"),

    EMAIL_PROVIDER: z.enum(["smtp", "resend", "simulated"]).optional(),
    EMAIL_FROM: z.string().min(1).optional(),
    RESEND_API_KEY: z.string().default(""),
    SMTP_HOST: z.string().default(""),
    SMTP_PORT: z.coerce.number().int().positive().default(587),
    SMTP_SECURE: flag.optional(),
    SMTP_USER: z.string().default(""),
    SMTP_PASS: z.string().default(""),

    STALL_THRESHOLD_DAYS: z.coerce.number().int().positive().default(5),
    CONTACT_COOLDOWN_DAYS: z.coerce.number().int().nonnegative().default(3),

    RATE_LIMIT_PER_MINUTE: z.coerce.number().int().positive().default(300),
    INVESTIGATE_RATE_LIMIT_PER_MINUTE: z.coerce.number().int().positive().default(10),
    TRUST_PROXY: flag.default("false"),

    ENABLE_DEMO_ENDPOINTS: flag.optional(),
    SEED_ON_EMPTY: flag.optional(),
});

export const ENV_KEYS = Object.keys(schema.shape);

type EmailProvider = "smtp" | "resend" | "simulated";

export interface EmailConfig {
    provider: EmailProvider;
    from: string;
    resendApiKey: string;
    smtp: { host: string; port: number; secure: boolean; user: string; pass: string };
}

const RESEND_SANDBOX_FROM = "NIAT Admissions <onboarding@resend.dev>";

export interface AppConfig {
    env: "development" | "test" | "production";
    isProduction: boolean;
    logLevel: string;
    logFile: string | undefined;
    port: number;
    corsOrigins: string[];
    database: { url: string; ssl: boolean; poolMax: number };
    gemini: { apiKey: string; model: string; enabled: boolean };
    email: EmailConfig;
    rules: { stallThresholdDays: number; contactCooldownDays: number };
    rateLimit: { perMinute: number; investigatePerMinute: number; trustProxy: boolean };
    demo: { endpoints: boolean; seedOnEmpty: boolean };
}

/** Google shows App Passwords in groups of four ("abcd efgh ijkl mnop"); the spaces are not part of the password. */
const isGmail = (host: string) => /(^|\.)(gmail|googlemail)\.com$/i.test(host);

/** Picks the email provider (explicit, else SMTP, else Resend, else simulated) and checks its settings are complete. */
function resolveEmail(e: z.infer<typeof schema>): EmailConfig {
    const provider: EmailProvider =
        e.EMAIL_PROVIDER ?? (e.SMTP_HOST ? "smtp" : e.RESEND_API_KEY ? "resend" : "simulated");

    const missing =
        provider === "smtp"
            ? [!e.SMTP_HOST && "SMTP_HOST", !e.SMTP_USER && "SMTP_USER", !e.SMTP_PASS && "SMTP_PASS"]
            : provider === "resend"
              ? [!e.RESEND_API_KEY && "RESEND_API_KEY"]
              : [];
    const absent = missing.filter(Boolean);
    if (absent.length > 0) {
        throw new Error(
            `Invalid environment configuration:\n  EMAIL_PROVIDER=${provider} requires ${absent.join(", ")}`,
        );
    }

    const defaultFrom = provider === "smtp" ? `NIAT Admissions <${e.SMTP_USER}>` : RESEND_SANDBOX_FROM;
    return {
        provider,
        from: e.EMAIL_FROM ?? defaultFrom,
        resendApiKey: e.RESEND_API_KEY,
        smtp: {
            host: e.SMTP_HOST,
            port: e.SMTP_PORT,
            secure: (e.SMTP_SECURE ?? (e.SMTP_PORT === 465 ? "true" : "false")) === "true",
            user: e.SMTP_USER,
            pass: isGmail(e.SMTP_HOST) ? e.SMTP_PASS.replace(/\s+/g, "") : e.SMTP_PASS,
        },
    };
}

/** An empty variable (for example `EMAIL_PROVIDER=` copied from .env.example) counts as not set. */
const withoutBlanks = (source: NodeJS.ProcessEnv): NodeJS.ProcessEnv =>
    Object.fromEntries(Object.entries(source).filter(([, value]) => value?.trim() !== ""));

/** Parses and validates environment variables into a typed config; throws a readable error when invalid. */
export function loadConfig(source: NodeJS.ProcessEnv = process.env): AppConfig {
    const parsed = schema.safeParse(withoutBlanks(source));
    if (!parsed.success) {
        const problems = parsed.error.issues.map((i) => `  ${i.path.join(".")}: ${i.message}`).join("\n");
        throw new Error(`Invalid environment configuration:\n${problems}`);
    }
    const e = parsed.data;
    const isProduction = e.NODE_ENV === "production";

    return {
        env: e.NODE_ENV,
        isProduction,
        logLevel: e.LOG_LEVEL,
        logFile: e.LOG_FILE,
        port: e.PORT,
        corsOrigins: e.FRONTEND_ORIGIN.split(",").map((o) => o.trim()),
        database: { url: e.DATABASE_URL, ssl: e.DATABASE_SSL === "true", poolMax: e.DATABASE_POOL_MAX },
        gemini: { apiKey: e.GEMINI_API_KEY, model: e.GEMINI_MODEL, enabled: e.GEMINI_API_KEY.length > 0 },
        email: resolveEmail(e),
        rules: { stallThresholdDays: e.STALL_THRESHOLD_DAYS, contactCooldownDays: e.CONTACT_COOLDOWN_DAYS },
        rateLimit: {
            perMinute: e.RATE_LIMIT_PER_MINUTE,
            investigatePerMinute: e.INVESTIGATE_RATE_LIMIT_PER_MINUTE,
            trustProxy: e.TRUST_PROXY === "true",
        },
        demo: {
            endpoints: (e.ENABLE_DEMO_ENDPOINTS ?? (isProduction ? "false" : "true")) === "true",
            seedOnEmpty: (e.SEED_ON_EMPTY ?? (isProduction ? "false" : "true")) === "true",
        },
    };
}
