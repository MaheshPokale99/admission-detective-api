"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/common/page-header";

export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <ErrorState
            title="This page hit a problem"
            message={error.digest ? `Unexpected error (reference ${error.digest}).` : "An unexpected error occurred."}
            onRetry={retry}
        />
    );
}
