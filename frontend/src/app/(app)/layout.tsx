import { Suspense } from "react";
import { PageSkeleton } from "@/components/common/page-header";
import { AppShell } from "@/components/layout/app-shell";

export default function AppLayout({ children }: LayoutProps<"/">) {
    return (
        <Suspense fallback={<PageSkeleton />}>
            <AppShell>{children}</AppShell>
        </Suspense>
    );
}
