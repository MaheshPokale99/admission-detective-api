"use client";

import { useEffect } from "react";
import "./globals.css";

export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <html lang="en">
            <body className="flex min-h-screen items-center justify-center bg-background p-6 font-sans text-foreground">
                <main role="alert" className="max-w-md space-y-4 text-center">
                    <h1 className="text-xl font-semibold tracking-tight">Something went wrong</h1>
                    <p className="text-sm text-muted-foreground">
                        The application failed to load. {error.digest ? `Reference: ${error.digest}.` : ""}
                    </p>
                    <button
                        type="button"
                        onClick={() => retry()}
                        className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground outline-none hover:bg-primary/80 focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                        Try again
                    </button>
                </main>
            </body>
        </html>
    );
}
