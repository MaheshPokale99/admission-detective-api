import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, describe, it } from "node:test";
import { createLogger } from "../../src/common/logger/logger.js";

const dir = mkdtempSync(join(tmpdir(), "logger-test-"));
after(() => rmSync(dir, { recursive: true, force: true }));

const waitForFile = async (path: string, text: string) => {
    for (let i = 0; i < 50; i++) {
        if (existsSync(path) && readFileSync(path, "utf8").includes(text)) return readFileSync(path, "utf8");
        await new Promise((resolve) => setTimeout(resolve, 100));
    }
    throw new Error(`"${text}" never reached ${path}`);
};

describe("createLogger", () => {
    it("writes JSON lines to LOG_FILE, creating missing folders", async () => {
        const file = join(dir, "nested", "app.log");
        const logger = createLogger({ env: "test", logLevel: "info", logFile: file });
        logger.info({ url: "http://localhost:5000" }, "Server started on http://localhost:5000");

        const line = JSON.parse((await waitForFile(file, "Server started")).trim().split("\n")[0]!) as {
            msg: string;
            url: string;
        };
        assert.equal(line.msg, "Server started on http://localhost:5000");
        assert.equal(line.url, "http://localhost:5000");
    });

    it("redacts personal data but not the email provider field", async () => {
        const file = join(dir, "redact.log");
        const logger = createLogger({ env: "test", logLevel: "info", logFile: file });
        logger.info({ email: "rahul@example.com", phone: "+91 99999 00000", emailProvider: "smtp" }, "check");

        const text = await waitForFile(file, "check");
        assert.ok(!text.includes("rahul@example.com") && !text.includes("99999"));
        assert.match(text, /"emailProvider":"smtp"/);
    });

    it("stays silent in tests unless a log file is configured", () => {
        assert.equal(createLogger({ env: "test", logLevel: "info", logFile: undefined }).level, "silent");
    });
});
