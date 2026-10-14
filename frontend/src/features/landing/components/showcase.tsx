import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";
import { ApprovalVignette, FindingsVignette, OutcomesVignette } from "./vignettes";

const ROWS = [
    {
        title: "Reasons backed by evidence",
        description:
            "The agent does not guess. Each reason cites a quote from the real conversation, and a reason without proof stays a possibility.",
        points: ["Quotes are matched to the transcript", "Unverified claims are downgraded"],
        vignette: <FindingsVignette />,
    },
    {
        title: "Nothing sent without a human",
        description:
            "Drafts wait in an approval queue. A counsellor edits the text, then approves or rejects it. Exactly what they approve is what goes out.",
        points: ["Edit the subject and message", "Rejections are logged with a reason"],
        vignette: <ApprovalVignette />,
    },
    {
        title: "See what actually works",
        description:
            "After a message goes out, the system tracks whether the student replied, booked a session or resumed their application, then compares approaches.",
        points: ["Outcomes tracked per message", "Recovery rate by follow-up type"],
        vignette: <OutcomesVignette />,
    },
] as const;

export function Showcase() {
    return (
        <section id="showcase" aria-labelledby="showcase-heading" className="scroll-mt-14 border-b py-20 md:py-28">
            <div className="mx-auto w-full max-w-6xl px-6">
                <SectionHeading
                    id="showcase-heading"
                    eyebrow="Showcase"
                    title="Built for counsellors to trust"
                    description="A closer look at the screens that keep every follow-up honest, approved and measurable."
                />

                <div className="mt-14 flex flex-col gap-20 md:mt-16 md:gap-28">
                    {ROWS.map((row, i) => (
                        <div key={row.title} className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
                            <Reveal className={cn(i % 2 === 1 && "md:order-2")}>
                                <h3 className="font-heading text-2xl font-semibold tracking-tight text-balance">
                                    {row.title}
                                </h3>
                                <p className="mt-3 text-base text-pretty text-muted-foreground">{row.description}</p>
                                <ul className="mt-5 space-y-2 text-sm">
                                    {row.points.map((point) => (
                                        <li key={point} className="flex items-center gap-2">
                                            <Check className="size-4 shrink-0 text-success" aria-hidden />
                                            {point}
                                        </li>
                                    ))}
                                </ul>
                            </Reveal>
                            <Reveal delay={0.1} y={12} className="w-full max-w-md justify-self-center md:max-w-none">
                                {row.vignette}
                            </Reveal>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
