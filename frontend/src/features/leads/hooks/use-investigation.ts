"use client";

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ApiError, investigate, type TraceStep } from "@/lib/api";
import { useRefreshAll } from "@/hooks/use-api";

interface Options {
    onReviewDraft?: () => void;
}

/** Runs the streamed investigation and exposes the live agent steps. */
export function useInvestigation(leadId: string, { onReviewDraft }: Options = {}) {
    const refresh = useRefreshAll();
    const [steps, setSteps] = useState<TraceStep[]>([]);

    const mutation = useMutation({
        mutationFn: () => investigate(leadId, (step) => setSteps((prev) => [...prev, step])),
        onMutate: () => setSteps([]),
        onSuccess: async ({ intervention }) => {
            await refresh();
            if (intervention) {
                toast.success("Investigation complete", {
                    description: "A draft is waiting for your approval.",
                    action: onReviewDraft ? { label: "Review draft", onClick: onReviewDraft } : undefined,
                });
            } else {
                toast.success("Investigation complete", { description: "No outreach is recommended for this lead." });
            }
        },
        onError: async (error) => {
            const reasons = error instanceof ApiError ? error.reasons : [];
            toast.error(error.message, { description: reasons.length ? reasons.join(" · ") : undefined });
            if (error instanceof ApiError && error.status === 409) await refresh();
        },
    });

    return {
        run: () => mutation.mutate(),
        isRunning: mutation.isPending,
        error: mutation.error,
        steps,
    };
}
