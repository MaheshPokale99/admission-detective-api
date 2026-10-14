import { AsyncLocalStorage } from "node:async_hooks";
import { PrismaPg } from "@prisma/adapter-pg";
import type { AppConfig } from "../config/env.js";
import { Prisma, PrismaClient } from "../generated/prisma/client.js";

export interface Transactional {
    transaction<T>(fn: () => Promise<T>): Promise<T>;
}

const TRANSACTION_MAX_WAIT_MS = 10_000;
const TRANSACTION_TIMEOUT_MS = 60_000;

/** Owns the Prisma client; repositories use `client`, which transparently joins an active transaction. */
export class Database implements Transactional {
    private readonly scope = new AsyncLocalStorage<Prisma.TransactionClient>();

    private constructor(readonly prisma: PrismaClient) {}

    static create(config: AppConfig["database"]): Database {
        const adapter = new PrismaPg({
            connectionString: config.url,
            max: config.poolMax,
            ssl: config.ssl ? { rejectUnauthorized: false } : undefined,
        });
        return new Database(new PrismaClient({ adapter }));
    }

    get client(): Prisma.TransactionClient {
        return this.scope.getStore() ?? this.prisma;
    }

    /** Runs `fn` in one interactive transaction; nested calls join the outer transaction. */
    transaction<T>(fn: () => Promise<T>): Promise<T> {
        if (this.scope.getStore()) return fn();
        return this.prisma.$transaction((tx) => this.scope.run(tx, fn), {
            maxWait: TRANSACTION_MAX_WAIT_MS,
            timeout: TRANSACTION_TIMEOUT_MS,
        });
    }

    async ping(): Promise<void> {
        await this.prisma.$queryRaw`SELECT 1`;
    }

    disconnect(): Promise<void> {
        return this.prisma.$disconnect();
    }
}

export const isMissingTable = (error: unknown): boolean =>
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021";

export const isUniqueViolation = (error: unknown): boolean =>
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
