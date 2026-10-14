import { SAFEGUARDS } from "../lib/content";
import { RevealGroup, RevealItem } from "./reveal";
import { SectionHeading } from "./section-heading";

export function Safeguards() {
    return (
        <section id="safeguards" aria-labelledby="safeguards-heading" className="scroll-mt-14 border-b py-20 md:py-28">
            <div className="mx-auto w-full max-w-6xl px-6">
                <SectionHeading
                    id="safeguards-heading"
                    eyebrow="Safeguards"
                    title="Guardrails on every message"
                    description="The agent is useful because it is constrained. These checks run before anything reaches a student."
                />

                <RevealGroup className="mt-14 grid gap-4 sm:grid-cols-2 md:mt-16 lg:grid-cols-3">
                    {SAFEGUARDS.map(({ title, description, icon: Icon }) => (
                        <RevealItem key={title} className="flex flex-col gap-3 rounded-xl border bg-card p-5">
                            <span className="flex size-9 items-center justify-center rounded-lg border bg-background">
                                <Icon className="size-4" aria-hidden />
                            </span>
                            <h3 className="text-sm font-semibold">{title}</h3>
                            <p className="text-sm text-pretty text-muted-foreground">{description}</p>
                        </RevealItem>
                    ))}
                </RevealGroup>
            </div>
        </section>
    );
}
