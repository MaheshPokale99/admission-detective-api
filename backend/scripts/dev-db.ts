import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { migrationSql } from "./migrations.js";

const port = Number(process.env.DEV_DB_PORT ?? 5432);
const dataDir = process.env.DEV_DB_DIR ?? "./data/pglite";

mkdirSync(dirname(dataDir), { recursive: true });
const db = await PGlite.create(dataDir);

const { rows } = await db.query<{ exists: boolean }>("SELECT to_regclass('public.leads') IS NOT NULL AS exists");
if (!rows[0]?.exists) {
    for (const script of migrationSql()) await db.exec(script);
    console.log("Applied Prisma migrations to the local database.");
}

const server = new PGLiteSocketServer({ db, port, host: "127.0.0.1", maxConnections: 10 });
await server.start();

console.log(`Local Postgres (PGlite) listening on postgresql://postgres:postgres@localhost:${port}/detective`);
console.log(`Data directory: ${dataDir}`);

const shutdown = async () => {
    await server.stop();
    await db.close();
    process.exit(0);
};
process.on("SIGINT", () => void shutdown());
process.on("SIGTERM", () => void shutdown());
