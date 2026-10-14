import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { seedMissingLeads } from "../../src/database/seed/seed.js";
import { createTestStack, type TestStack } from "../helpers/test-stack.js";

describe("seedMissingLeads", () => {
    let stack: TestStack;
    before(async () => {
        stack = await createTestStack();
    });
    after(() => stack.stop());

    it("does nothing when every sample lead already exists", async () => {
        assert.deepEqual(await seedMissingLeads(stack.database), []);
    });

    it("adds only the missing lead and keeps all other data untouched", async () => {
        const db = stack.database.client;
        await db.message.deleteMany({ where: { leadId: "lead_mahesh" } });
        await db.lead.delete({ where: { id: "lead_mahesh" } });
        await db.lead.update({ where: { id: "lead_rahul" }, data: { counsellor: "Changed by hand" } });
        const before = await db.lead.count();

        assert.deepEqual(await seedMissingLeads(stack.database), ["Mahesh Pokale"]);

        assert.equal(await db.lead.count(), before + 1);
        const mahesh = await db.lead.findUniqueOrThrow({ where: { id: "lead_mahesh" } });
        assert.equal(mahesh.email, "maheshpokale740@gmail.com");
        assert.equal(await db.message.count({ where: { leadId: "lead_mahesh" } }), 3);
        const rahul = await db.lead.findUniqueOrThrow({ where: { id: "lead_rahul" } });
        assert.equal(rahul.counsellor, "Changed by hand", "existing leads are not overwritten");
    });
});
