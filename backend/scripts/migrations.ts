import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const MIGRATIONS_DIR = join(import.meta.dirname, "..", "prisma", "migrations");

/** SQL of every Prisma migration, in order. Used to bootstrap PGlite, which Prisma Migrate cannot talk to. */
export function migrationSql(): string[] {
    return readdirSync(MIGRATIONS_DIR, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .sort()
        .map((name) => readFileSync(join(MIGRATIONS_DIR, name, "migration.sql"), "utf8"));
}
