import { SearchCheck } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/config/navigation";
import { ThemeMenu } from "./theme-menu";

const LINKS = [
    { href: "#how-it-works", label: "How it works" },
    { href: "#showcase", label: "Showcase" },
    { href: "#safeguards", label: "Safeguards" },
] as const;

export function SiteHeader() {
    return (
        <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur supports-backdrop-filter:bg-background/60">
            <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-6">
                <Link
                    href="/"
                    className="flex items-center gap-2.5 rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                    <span className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        <SearchCheck className="size-4" aria-hidden />
                    </span>
                    <span className="sr-only text-sm font-semibold whitespace-nowrap sm:not-sr-only">{APP_NAME}</span>
                </Link>

                <nav aria-label="Page sections" className="hidden items-center gap-1 md:flex">
                    {LINKS.map(({ href, label }) => (
                        <Button key={href} variant="ghost" nativeButton={false} render={<a href={href} />}>
                            {label}
                        </Button>
                    ))}
                </nav>

                <div className="flex items-center gap-2">
                    <ThemeMenu />
                    <Button nativeButton={false} render={<Link href="/dashboard" />}>
                        <span className="sm:hidden">Dashboard</span>
                        <span className="hidden sm:inline">Open dashboard</span>
                    </Button>
                </div>
            </div>
        </header>
    );
}
