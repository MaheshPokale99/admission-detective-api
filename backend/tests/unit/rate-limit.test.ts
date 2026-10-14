import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { Hono } from "hono";
import type { AppEnv } from "../../src/common/http/app-env.js";
import { errorHandler } from "../../src/common/middleware/error-handler.js";
import { rateLimit } from "../../src/common/middleware/rate-limit.js";

const build = (max: number) => {
    const app = new Hono<AppEnv>();
    app.use(rateLimit({ windowMs: 60_000, max }));
    app.get("/", (c) => c.json({ ok: true }));
    app.onError(errorHandler);
    return app;
};

describe("rateLimit", () => {
    it("allows requests up to the limit and reports what remains", async () => {
        const app = build(2);
        const first = await app.request("/");
        assert.equal(first.status, 200);
        assert.equal(first.headers.get("RateLimit-Limit"), "2");
        assert.equal(first.headers.get("RateLimit-Remaining"), "1");
        assert.equal((await app.request("/")).status, 200);
    });

    it("answers 429 with Retry-After and the standard error body once exceeded", async () => {
        const app = build(1);
        await app.request("/");
        const blocked = await app.request("/");
        assert.equal(blocked.status, 429);
        assert.ok(Number(blocked.headers.get("Retry-After")) >= 1);
        const body = (await blocked.json()) as { error: { code: string } };
        assert.equal(body.error.code, "RATE_LIMITED");
    });
});
