import { FunctionCallingConfigMode, GoogleGenAI } from "@google/genai";
import { AGENT_TEMPERATURE } from "../../common/constants.js";
import { UpstreamError } from "../../common/errors/app-error.js";
import type { AppConfig } from "../../config/env.js";
import type { GenerateFn } from "./agent.types.js";
import { SYSTEM_PROMPT } from "./prompt.js";
import { functionDeclarations } from "./tool-declarations.js";

/** Builds the single Gemini call the agent loop uses; without an API key every call fails with a clear error. */
export function createGenerateFn(config: AppConfig["gemini"]): GenerateFn {
    if (!config.enabled) {
        return () => Promise.reject(new UpstreamError("Investigation is not available right now."));
    }

    const ai = new GoogleGenAI({ apiKey: config.apiKey });
    return (contents) =>
        ai.models.generateContent({
            model: config.model,
            contents,
            config: {
                systemInstruction: SYSTEM_PROMPT,
                temperature: AGENT_TEMPERATURE,
                tools: [{ functionDeclarations: [...functionDeclarations] }],
                toolConfig: { functionCallingConfig: { mode: FunctionCallingConfigMode.ANY } },
            },
        });
}
