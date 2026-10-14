import type { Context } from "hono";
import type { z } from "zod";
import { ValidationError } from "../errors/app-error.js";
import type { AppEnv } from "./app-env.js";

const toValidationError = (error: z.ZodError) =>
    new ValidationError(
        "Invalid request",
        error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    );

function parse<T extends z.ZodType>(schema: T, value: unknown): z.infer<T> {
    const result = schema.safeParse(value);
    if (!result.success) throw toValidationError(result.error);
    return result.data;
}

export const parseParams = <T extends z.ZodType>(c: Context<AppEnv>, schema: T): z.infer<T> =>
    parse(schema, c.req.param());

export const parseQuery = <T extends z.ZodType>(c: Context<AppEnv>, schema: T): z.infer<T> =>
    parse(schema, c.req.query());

/** Reads and validates the JSON body; malformed JSON is reported as a validation error. */
export async function parseBody<T extends z.ZodType>(c: Context<AppEnv>, schema: T): Promise<z.infer<T>> {
    let raw: unknown;
    try {
        raw = await c.req.json();
    } catch {
        throw new ValidationError("Request body must be valid JSON");
    }
    return parse(schema, raw);
}
