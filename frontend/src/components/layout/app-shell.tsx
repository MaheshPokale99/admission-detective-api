import { AppBreadcrumb } from "@/components/layout/app-breadcrumb";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider>
            <a
                href="#main-content"
                className="sr-only z-50 rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
            >
                Skip to content
            </a>
            <AppSidebar />
            <SidebarInset>
                <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur supports-backdrop-filter:bg-background/60">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-1 data-vertical:h-4 data-vertical:self-center" />
                    <AppBreadcrumb />
                </header>
                <div
                    id="main-content"
                    tabIndex={-1}
                    className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 outline-none md:px-6 md:py-8 lg:px-8"
                >
                    {children}
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
