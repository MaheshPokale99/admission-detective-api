import { ServiceUnavailableError } from "../../common/errors/app-error.js";
import type { AppConfig } from "../../config/env.js";
import type { Database } from "../../database/database.js";
import { seedDatabase } from "../../database/seed/seed.js";

export class SystemService {
    constructor(
        private readonly database: Database,
        private readonly config: AppConfig,
    ) {}

    /** Public configuration status shown in the UI. */
    status() {
        return {
            ok: true,
            gemini: { configured: this.config.gemini.enabled, model: this.config.gemini.model },
            email: this.config.email.provider,
            demoEndpoints: this.config.demo.endpoints,
        };
    }

    /** Readiness: the process is up and the database answers. */
    async assertReady(): Promise<void> {
        try {
            await this.database.ping();
        } catch {
            throw new ServiceUnavailableError("Database is not reachable");
        }
    }

    async resetDemoData(): Promise<void> {
        await seedDatabase(this.database, { reset: true });
    }
}
