import { z } from "zod";
import { investigationOutputSchema } from "./investigation-output.schema.js";

export const TOOL = {
    leadProfile: "get_lead_profile",
    conversation: "get_conversation_history",
    resources: "search_verified_resources",
    pastResults: "get_past_intervention_results",
    submit: "submit_investigation",
} as const;

export const TOOL_LABELS: Record<string, string> = {
    [TOOL.leadProfile]: "Reviewing lead profile",
    [TOOL.conversation]: "Reading full conversation",
    [TOOL.resources]: "Searching verified knowledge base",
    [TOOL.pastResults]: "Checking what worked before",
    [TOOL.submit]: "Writing findings and recommendation",
};

const { $schema: _draftMarker, ...submitSchema } = z.toJSONSchema(investigationOutputSchema, {
    target: "draft-7",
}) as Record<string, unknown>;

export const functionDeclarations = [
    {
        name: TOOL.leadProfile,
        description:
            "Get the profile of the lead under investigation: program, funnel stage, counsellor, days inactive, consent and eligibility.",
        parametersJsonSchema: { type: "object", properties: {} },
    },
    {
        name: TOOL.conversation,
        description:
            "Get every recorded message with this lead, oldest first, each with an id. call_note/internal entries are the counsellor's notes of what the lead said on a call.",
        parametersJsonSchema: { type: "object", properties: {} },
    },
    {
        name: TOOL.resources,
        description:
            "Search the admissions team's VERIFIED knowledge base (fees, EMI, scholarship, parent session, curriculum, documents, hostel, callback). These are the only facts you may use in a message.",
        parametersJsonSchema: {
            type: "object",
            properties: {
                query: {
                    type: "string",
                    description: "Keywords such as 'fees emi' or 'parent session'. Use 'all' to list everything.",
                },
            },
            required: ["query"],
        },
    },
    {
        name: TOOL.pastResults,
        description:
            "Historical results of past recovery messages: how many were sent per action type and how many leads came back. Use it to choose between actions. Small samples must be described as such.",
        parametersJsonSchema: {
            type: "object",
            properties: {
                category: {
                    type: "string",
                    description: "Optional reason category to filter by, e.g. fees, parent_approval, course_clarity.",
                },
            },
        },
    },
    {
        name: TOOL.submit,
        description:
            "Submit your final findings. Call this exactly once, after reading the conversation and searching the knowledge base.",
        parametersJsonSchema: submitSchema,
    },
] as const;
