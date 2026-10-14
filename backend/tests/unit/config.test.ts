import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { parse } from "dotenv";
import { ENV_KEYS, loadConfig } from "../../src/config/env.js";

describe("loadConfig", () => {
    it("treats empty variables as not set", () => {
        const config = loadConfig({
            EMAIL_PROVIDER: "",
            EMAIL_FROM: "",
            SMTP_SECURE: "",
            SMTP_PORT: "",
            GEMINI_API_KEY: "",
        });
        assert.equal(config.email.provider, "simulated");
        assert.equal(config.email.smtp.port, 587);
        assert.equal(config.gemini.enabled, false);
    });

    it("loads the shipped .env.example unchanged, so copying it never breaks start-up", () => {
        const example = parse(readFileSync(new URL("../../.env.example", import.meta.url)));
        const config = loadConfig(example);
        assert.equal(config.database.ssl, true);
        assert.equal(config.email.provider, "smtp");
        assert.equal(config.email.smtp.host, "smtp.gmail.com");
        assert.match(config.database.url, /pooler\.supabase\.com:5432/);
    });

    it(".env.example lists every setting the code reads, and nothing it does not", () => {
        const example = Object.keys(parse(readFileSync(new URL("../../.env.example", import.meta.url))));
        assert.deepEqual([...example].sort(), [...ENV_KEYS].sort());
    });

    it("removes the spaces Google shows in a Gmail App Password, but leaves other providers alone", () => {
        const gmail = loadConfig({
            SMTP_HOST: "smtp.gmail.com",
            SMTP_USER: "me@gmail.com",
            SMTP_PASS: "abcd efgh ijkl mnop",
        });
        assert.equal(gmail.email.smtp.pass, "abcdefghijklmnop");

        const other = loadConfig({ SMTP_HOST: "smtp.example.com", SMTP_USER: "me", SMTP_PASS: "pass with spaces" });
        assert.equal(other.email.smtp.pass, "pass with spaces");
    });

    it("rejects invalid values with a readable message", () => {
        assert.throws(() => loadConfig({ PORT: "abc" }), /Invalid environment configuration[\s\S]*PORT/);
        assert.throws(() => loadConfig({ DATABASE_SSL: "yes" }), /DATABASE_SSL/);
    });
});
