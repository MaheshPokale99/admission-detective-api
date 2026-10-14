import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { strayUrls, unverifiedFigures } from "../../src/domain/draft-checks.js";
import type { Resource } from "../../src/modules/resources/resources.types.js";
import { makeMessage } from "../helpers/factories.js";

const resources: Resource[] = [
    {
        id: "res_fees",
        category: "fees",
        title: "Fees",
        content: "Annual tuition is ₹2,40,000. EMI plans run 12, 24 or 36 months.",
        url: "https://example.test/fees",
        verifiedAt: "2026-10-01T00:00:00.000Z",
        verifiedBy: "ops",
    },
];
const transcript = [makeMessage({ body: "Is a 50% scholarship possible?" })];

describe("unverifiedFigures", () => {
    it("accepts figures that come from verified resources", () => {
        assert.deepEqual(unverifiedFigures("Tuition is ₹2,40,000 with EMI over 12 months.", resources, transcript), []);
    });

    it("accepts figures the lead mentioned themselves", () => {
        assert.deepEqual(unverifiedFigures("You asked about a 50% scholarship.", resources, transcript), []);
    });

    it("flags figures found nowhere", () => {
        assert.deepEqual(
            unverifiedFigures("We can offer a 90% scholarship and ₹1,00,000 fees.", resources, transcript),
            ["90%", "₹1,00,000"],
        );
    });
});

describe("strayUrls", () => {
    it("finds links the model wrote", () => {
        assert.deepEqual(strayUrls("See https://evil.test/x and http://a.test"), [
            "https://evil.test/x",
            "http://a.test",
        ]);
        assert.deepEqual(strayUrls("No links here"), []);
    });
});
