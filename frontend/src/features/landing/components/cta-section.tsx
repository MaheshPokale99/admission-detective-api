import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Reveal } from "./reveal";

export function CtaSection() {
    return (
        <section aria-labelledby="cta-heading" className="py-20 md:py-28">
            <div className="mx-auto w-full max-w-6xl px-6">
                <Reveal className="flex flex-col items-center rounded-xl border bg-card px-6 py-12 text-center md:py-16">
                    <h2
                        id="cta-heading"
                        className="max-w-xl font-heading text-3xl font-semibold tracking-tight text-balance md:text-4xl"
                    >
                        See who went quiet today.
                    </h2>
                    <p className="mt-4 max-w-md text-base text-pretty text-muted-foreground">
                        Open the dashboard to review stalled leads, read the evidence and approve the first follow-up.
                    </p>
                    <Button size="lg" className="mt-8 px-4" nativeButton={false} render={<Link href="/dashboard" />}>
                        Open the dashboard
                        <ArrowRight data-icon="inline-end" aria-hidden />
                    </Button>
                </Reveal>
            </div>
        </section>
    );
}
