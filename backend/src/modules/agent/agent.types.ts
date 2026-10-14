import type { Content, GenerateContentResponse } from "@google/genai";
import type { Lead } from "../leads/leads.types.js";
import type { Message } from "../messages/messages.types.js";
import type { InvestigationOutput } from "./investigation-output.schema.js";

export interface TraceStep {
    tool: string;
    label: string;
    summary: string;
    at: string;
}

export interface DetectiveRun {
    output: InvestigationOutput;
    trace: TraceStep[];
    model: string;
    durationMs: number;
}

export type GenerateFn = (contents: Content[]) => Promise<GenerateContentResponse>;

export interface ToolContext {
    lead: Lead;
    transcript: Message[];
    state: { readConversation: boolean };
}

export interface ToolOutcome {
    output: unknown;
    summary: string;
}
