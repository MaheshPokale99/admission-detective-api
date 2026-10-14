import { loadConfig } from "../src/config/env.js";
import { Database } from "../src/database/database.js";
import { seedMissingLeads } from "../src/database/seed/seed.js";

const database = Database.create(loadConfig().database);
const added = await seedMissingLeads(database);
await database.disconnect();

console.log(
    added.length > 0 ? `Added sample leads: ${added.join(", ")}` : "No sample leads were missing. Nothing changed.",
);
