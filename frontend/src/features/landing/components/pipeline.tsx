"use client";

import { animate, motion, useInView, useMotionValue, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState, type RefObject } from "react";
import { STEPS } from "../lib/content";
import { EASE, VIEWPORT } from "../lib/motion";
import { usePathPoint } from "../lib/use-path-point";
import { SectionHeading } from "./section-heading";

const W = 1000;
const H = 100;
const nodes = STEPS.map((_, i) => ({ x: ((i + 0.5) * W) / STEPS.length, y: i % 2 === 0 ? 34 : 66 }));

const PATH_D = [{ x: 0, y: H / 2 }, ...nodes, { x: W, y: H / 2 }].reduce((d, p, i, pts) => {
    if (i === 0) return `M${p.x} ${p.y}`;
    const mid = (pts[i - 1].x + p.x) / 2;
    return `${d} C${mid} ${pts[i - 1].y}, ${mid} ${p.y}, ${p.x} ${p.y}`;
}, "");

/** Horizontal route with icon nodes and a travelling dot, shown from the lg breakpoint up. */
function DesktopPath() {
    const reduce = useReducedMotion();
    const ref = useRef<HTMLDivElement>(null);
    const measure = useRef<SVGPathElement>(null);
    const inView = useInView(ref, VIEWPORT);
    const progress = useMotionValue(0);
    const { x, y } = usePathPoint(measure, progress);

    useEffect(() => {
        if (reduce || !inView) return;
        const controls = animate(progress, [0, 1], {
            duration: 9,
            delay: 1.6,
            ease: "linear",
            repeat: Infinity,
            repeatDelay: 0.8,
        });
        return () => controls.stop();
    }, [reduce, inView, progress]);

    return (
        <div ref={ref} aria-hidden className="relative hidden lg:block" style={{ aspectRatio: `${W} / ${H}` }}>
            <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 size-full overflow-visible" role="presentation">
                <path ref={measure} d={PATH_D} fill="none" />
                <path d={PATH_D} fill="none" strokeWidth={1.5} className="stroke-border" strokeDasharray="2 6" />
                <motion.path
                    d={PATH_D}
                    fill="none"
                    strokeWidth={2}
                    strokeLinecap="round"
                    className="stroke-foreground/40"
                    initial={{ pathLength: reduce ? 1 : 0 }}
                    whileInView={{ pathLength: 1 }}
                    viewport={VIEWPORT}
                    transition={{ duration: reduce ? 0.01 : 1.4, ease: "easeInOut" }}
                />
                {!reduce && (
                    <motion.g style={{ x, y }} initial={{ opacity: 0 }} animate={{ opacity: inView ? 1 : 0 }}>
                        <circle r={9} className="fill-foreground/10" />
                        <circle r={4.5} className="fill-foreground" />
                    </motion.g>
                )}
            </svg>
            {STEPS.map(({ icon: Icon, title }, i) => (
                <span
                    key={title}
                    className="absolute -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `${nodes[i].x / 10}%`, top: `${nodes[i].y}%` }}
                >
                    <motion.span
                        className="flex size-11 items-center justify-center rounded-full border bg-card text-foreground"
                        initial={reduce ? false : { opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={VIEWPORT}
                        transition={{ duration: 0.4, delay: 0.15 + i * 0.16, ease: EASE }}
                    >
                        <Icon className="size-5" aria-hidden />
                    </motion.span>
                </span>
            ))}
        </div>
    );
}

/** Vertical route drawn between the step icons on small screens. */
function MobilePath({ listRef }: { listRef: RefObject<HTMLOListElement | null> }) {
    const reduce = useReducedMotion();
    const inView = useInView(listRef, VIEWPORT);
    const [length, setLength] = useState(0);
    const dotY = useMotionValue(0);

    useEffect(() => {
        const list = listRef.current;
        if (!list) return;
        const measureLength = () => {
            const first = list.firstElementChild as HTMLElement;
            const last = list.lastElementChild as HTMLElement;
            setLength(last.offsetTop - first.offsetTop);
        };
        measureLength();
        const observer = new ResizeObserver(measureLength);
        observer.observe(list);
        return () => observer.disconnect();
    }, [listRef]);

    useEffect(() => {
        if (reduce || !inView || length === 0) return;
        const controls = animate(dotY, [0, length], {
            duration: 8,
            delay: 1.6,
            ease: "linear",
            repeat: Infinity,
            repeatDelay: 0.8,
        });
        return () => controls.stop();
    }, [reduce, inView, length, dotY]);

    return (
        <div aria-hidden className="absolute top-5 left-[19px] w-0.5 lg:hidden" style={{ height: length }}>
            <svg width={2} height={length} className="absolute top-0 left-0 overflow-visible" role="presentation">
                <path
                    d={`M1 0 V${length}`}
                    fill="none"
                    strokeWidth={1.5}
                    className="stroke-border"
                    strokeDasharray="2 6"
                />
                <motion.path
                    d={`M1 0 V${length}`}
                    fill="none"
                    strokeWidth={2}
                    strokeLinecap="round"
                    className="stroke-foreground/40"
                    initial={{ pathLength: reduce ? 1 : 0 }}
                    animate={{ pathLength: reduce || inView ? 1 : 0 }}
                    transition={{ duration: reduce ? 0.01 : 1.4, ease: "easeInOut" }}
                />
            </svg>
            {!reduce && length > 0 && (
                <motion.span
                    style={{ y: dotY }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: inView ? 1 : 0 }}
                    className="absolute top-0 left-0 -mt-[9px] -ml-2 flex size-[18px] items-center justify-center rounded-full bg-foreground/10"
                >
                    <span className="size-[9px] rounded-full bg-foreground" />
                </motion.span>
            )}
        </div>
    );
}

export function Pipeline() {
    const listRef = useRef<HTMLOListElement>(null);
    const reduce = useReducedMotion();

    return (
        <section id="how-it-works" aria-labelledby="how-heading" className="scroll-mt-14 border-b py-20 md:py-28">
            <div className="mx-auto w-full max-w-6xl px-6">
                <SectionHeading
                    id="how-heading"
                    eyebrow="How it works"
                    title="From a silent lead to a measured outcome"
                    description="One pipeline, seven steps. The agent investigates, but people stay in charge of what gets sent."
                />

                <div className="relative mt-14 md:mt-16">
                    <DesktopPath />
                    <MobilePath listRef={listRef} />
                    <ol ref={listRef} className="relative grid gap-8 lg:mt-4 lg:grid-cols-7 lg:gap-4">
                        {STEPS.map(({ title, description, icon: Icon }, i) => (
                            <motion.li
                                key={title}
                                className="flex gap-4 lg:flex-col lg:items-center lg:gap-0 lg:text-center"
                                initial={reduce ? false : { opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={VIEWPORT}
                                transition={{ duration: 0.5, delay: 0.1 + i * 0.07, ease: EASE }}
                            >
                                <span
                                    aria-hidden
                                    className="relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full border bg-card lg:hidden"
                                >
                                    <Icon className="size-5" />
                                </span>
                                <div className="min-w-0 pt-0.5 lg:pt-0">
                                    <p className="text-xs text-muted-foreground tabular-nums">
                                        Step {String(i + 1).padStart(2, "0")}
                                    </p>
                                    <h3 className="mt-0.5 text-sm font-semibold">{title}</h3>
                                    <p className="mt-1.5 text-sm text-pretty text-muted-foreground">{description}</p>
                                </div>
                            </motion.li>
                        ))}
                    </ol>
                </div>
            </div>
        </section>
    );
}
