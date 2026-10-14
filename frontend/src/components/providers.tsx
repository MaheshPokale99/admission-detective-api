"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useState, type ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ApiError } from "@/lib/api";

const shouldRetry = (count: number, error: unknown) =>
    count < 2 && !(error instanceof ApiError && error.status >= 400 && error.status < 500);

export function Providers({ children }: { children: ReactNode }) {
    const [client] = useState(
        () =>
            new QueryClient({
                defaultOptions: { queries: { staleTime: 10_000, refetchOnWindowFocus: false, retry: shouldRetry } },
            }),
    );
    return (
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <QueryClientProvider client={client}>
                <TooltipProvider>
                    {children}
                    <Toaster position="bottom-right" />
                </TooltipProvider>
            </QueryClientProvider>
        </ThemeProvider>
    );
}
