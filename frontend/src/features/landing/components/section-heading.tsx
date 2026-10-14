import { cn } from "@/lib/utils";

interface SectionHeadingProps {
    id: string;
    eyebrow: string;
    title: string;
    description: string;
    className?: string;
}

export function SectionHeading({ id, eyebrow, title, description, className }: SectionHeadingProps) {
    return (
        <div className={cn("mx-auto max-w-2xl text-center", className)}>
            <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">{eyebrow}</p>
            <h2 id={id} className="mt-3 font-heading text-3xl font-semibold tracking-tight text-balance md:text-4xl">
                {title}
            </h2>
            <p className="mt-4 text-base text-pretty text-muted-foreground">{description}</p>
        </div>
    );
}
