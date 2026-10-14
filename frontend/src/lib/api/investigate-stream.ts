import { API_BASE, ApiError, toApiError } from "./client";
import type { Intervention, Investigation, TraceStep } from "./types";

/**
 * Starts an investigation and streams the agent's steps (Server-Sent Events over fetch,
 * because EventSource cannot POST).
 */
export async function investigate(
    leadId: string,
    onStep: (s: TraceStep) => void,
): Promise<{ investigation: Investigation; intervention: Intervention | null }> {
    let res: Response;
    try {
        res = await fetch(`${API_BASE}/leads/${leadId}/investigate`, { method: "POST" });
    } catch {
        throw new ApiError("Cannot reach the server. Check your connection and try again.", 0, "network_error");
    }
    if (!res.ok || !res.body) throw toApiError(res.status, await res.json().catch(() => null));

    const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
    let buffer = "";
    for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += value.replace(/\r\n/g, "\n");
        let idx: number;
        while ((idx = buffer.indexOf("\n\n")) !== -1) {
            const raw = buffer.slice(0, idx);
            buffer = buffer.slice(idx + 2);
            let event = "message";
            const data: string[] = [];
            for (const line of raw.split("\n")) {
                if (line.startsWith("event:")) event = line.slice(6).trim();
                else if (line.startsWith("data:")) data.push(line.slice(5).trimStart());
            }
            if (data.length === 0) continue;
            const payload = JSON.parse(data.join("\n"));
            if (event === "step") onStep(payload as TraceStep);
            else if (event === "error") {
                const err = payload?.error;
                throw new ApiError(err?.message ?? "Investigation failed", 502, err?.code ?? "investigation_failed");
            } else if (event === "result") return payload;
        }
    }
    throw new ApiError("The investigation ended unexpectedly", 502, "stream_closed");
}
