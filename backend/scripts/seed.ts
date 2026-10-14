import { loadConfig } from "../src/config/env.js";
import { Database } from "../src/database/database.js";
import { seedDatabase } from "../src/database/seed/seed.js";

const database = Database.create(loadConfig().database);
await seedDatabase(database, { reset: true });
await database.disconnect();
console.log("Database reset and seeded with demo data.");
