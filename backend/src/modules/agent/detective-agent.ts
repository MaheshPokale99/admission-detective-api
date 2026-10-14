import type { Content, Part } from "@google/genai";
import {
    AGENT_MAX_IDLE_TURNS,
    AGENT_MAX_RETRIES,
    AGENT_MAX_TURNS,
    AGENT_RETRY_BASE_MS,
} from "../../common/constants.js";
import { UpstreamError } from "../../common/errors/app-error.js";
import type { Logger } from "../../common/logger/logger.js";
import { nowIso } from "../../common/utils/time.js";
import type { Lead } from "../leads/leads.types.js";
import type { Message } from "../messages/messages.types.js";
import type { DetectiveRun, GenerateFn, ToolContext, TraceStep } from "./agent.types.js";
import { investigationOutputSchema } from "./investigation-output.schema.js";
import { taskPrompt } from "./prompt.js";
import { TOOL, TOOL_LABELS } from "./tool-declarations.js";
import type { AgentToolbox } from "./toolbox.js";

const INVESTIGATION_FAILED = "The investigation could not be completed. Please try again.";
const RETRYABLE_STATUSES = new Set([429, 500, 503, 504]);
const MAX_ISSUES_REPORTED = 8;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const functionResponse = (name: string, output: unknown): Part => {
    const isError = typeof output === "object" && output !== null && "error" in output;
    return { functionResponse: { name, response: isError ? output : { output } } };
};

export interface DetectiveAgentDeps {
    generate: GenerateFn;
    toolbox: AgentToolbox;
    model: string;
    logger: Logger;
}

/** Gemini function-calling loop that investigates one lead and returns a validated investigation. */
export class DetectiveAgent {
    constructor(private readonly deps: DetectiveAgentDeps) {}

    async run(lead: Lead, transcript: Message[], onStep: (step: TraceStep) => void = () => {}): Promise<DetectiveRun> {
        const started = Date.now();
        const ctx: ToolContext = { lead, transcript, state: { readConversation: false } };
        const trace: TraceStep[] = [];
        const record = (tool: string, summary: string) => {
            const step: TraceStep = { tool, label: TOOL_LABELS[tool] ?? tool, summary, at: nowIso() };
            trace.push(step);
            onStep(step);
        };

        const contents: Content[] = [{ role: "user", parts: [{ text: taskPrompt(lead) }] }];
        let idleTurns = 0;

        for (let turn = 0; turn < AGENT_MAX_TURNS; turn++) {
            const response = await this.generateWithRetry(contents);
            const calls = response.functionCalls ?? [];
            const modelContent = response.candidates?.[0]?.content;

            if (calls.length === 0 || !modelContent) {
                if (++idleTurns > AGENT_MAX_IDLE_TURNS) {
                    this.deps.logger.error({ turn }, "model stopped without submitting an investigation");
                    throw new UpstreamError(INVESTIGATION_FAILED);
                }
                contents.push({
                    role: "user",
                    parts: [{ text: "Continue by calling a tool. Finish with submit_investigation." }],
                });
                continue;
            }

            contents.push(modelContent);
            const responses: Part[] = [];

            for (const call of calls) {
                const name = call.name ?? "";
                const args = call.args ?? {};

                if (name === TOOL.submit) {
                    if (!ctx.state.readConversation) {
                        responses.push(
                            functionResponse(name, {
                                error: "Read the conversation with get_conversation_history before submitting.",
                            }),
                        );
                        continue;
                    }
                    const parsed = investigationOutputSchema.safeParse(args);
                    if (!parsed.success) {
                        responses.push(
                            functionResponse(name, {
                                error: "Invalid submission. Fix these problems and call submit_investigation again.",
                                issues: parsed.error.issues
                                    .slice(0, MAX_ISSUES_REPORTED)
                                    .map((i) => `${i.path.join(".")}: ${i.message}`),
                            }),
                        );
                        continue;
                    }
                    record(name, `Recommended action: ${parsed.data.recommendation.action}`);
                    return { output: parsed.data, trace, model: this.deps.model, durationMs: Date.now() - started };
                }

                const result = await this.deps.toolbox.execute(name, args, ctx);
                record(name, result.summary);
                responses.push(functionResponse(name, result.output));
            }

            contents.push({ role: "user", parts: responses });
        }

        this.deps.logger.error({ maxTurns: AGENT_MAX_TURNS }, "agent did not finish within the turn limit");
        throw new UpstreamError(INVESTIGATION_FAILED);
    }

    private async generateWithRetry(contents: Content[]) {
        let lastError: unknown;
        for (let attempt = 1; attempt <= AGENT_MAX_RETRIES; attempt++) {
            try {
                return await this.deps.generate(contents);
            } catch (error) {
                lastError = error;
                const status = (error as { status?: number }).status;
                if (!status || !RETRYABLE_STATUSES.has(status) || attempt === AGENT_MAX_RETRIES) break;
                this.deps.logger.warn({ attempt, status }, "Gemini request failed, retrying");
                await sleep(AGENT_RETRY_BASE_MS * attempt);
            }
        }
        this.deps.logger.error({ err: lastError }, "model request failed");
        throw new UpstreamError(INVESTIGATION_FAILED);
    }
}
