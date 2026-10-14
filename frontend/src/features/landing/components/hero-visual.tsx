"use client";

import { animate, motion, useInView, useMotionValue, useReducedMotion } from "framer-motion";
import { useEffect, useRef } from "react";

const COLS = 10;
const ROWS = 3;
const X0 = 40;
const STEP = 44.4;
const Y0 = 52;
const ROW_GAP = 40;
const PICKED = { col: 6, row: 2 };
const PATH_D = "M306.4 132 C306.4 196, 392 168, 392 224";
const TARGET = { x: 392, y: 224 };

const dots = Array.from({ length: COLS * ROWS }, (_, i) => ({
    col: i % COLS,
    row: Math.floor(i / COLS),
}));

/** Decorative scene: quiet leads fade out and one is picked up and carried back to the counsellor. */
export function HeroVisual() {
    const reduce = useReducedMotion();
    const ref = useRef<HTMLDivElement>(null);
    const inView = useInView(ref);
    const pathRef = useRef<SVGPathElement>(null);
    const progress = useMotionValue(0);
    const x = useMotionValue(X0 + PICKED.col * STEP);
    const y = useMotionValue(Y0 + PICKED.row * ROW_GAP);

    useEffect(() => {
        if (reduce || !inView) return;
        const path = pathRef.current;
        if (!path) return;
        const total = path.getTotalLength();
        const unsub = progress.on("change", (p) => {
            const pt = path.getPointAtLength(p * total);
            x.set(pt.x);
            y.set(pt.y);
        });
        const controls = animate(progress, [0, 0, 1, 1], {
            duration: 5.5,
            times: [0, 0.18, 0.7, 1],
            ease: ["linear", [0.45, 0, 0.25, 1], "linear"],
            repeat: Infinity,
            repeatDelay: 0.6,
        });
        return () => {
            controls.stop();
            unsub();
        };
    }, [reduce, inView, progress, x, y]);

    return (
        <div ref={ref} aria-hidden className="mx-auto w-full max-w-md rounded-xl border bg-card p-4 lg:max-w-none">
            <svg viewBox="0 0 480 270" className="h-auto w-full text-foreground" role="presentation">
                {dots.map(({ col, row }) => {
                    const picked = col === PICKED.col && row === PICKED.row;
                    const cx = X0 + col * STEP;
                    const cy = Y0 + row * ROW_GAP;
                    const lively = (col * 3 + row * 5) % 7 === 0;
                    if (picked) return null;
                    return (
                        <motion.circle
                            key={`${col}-${row}`}
                            cx={cx}
                            cy={cy}
                            r={7}
                            fill="currentColor"
                            initial={{ opacity: lively ? 0.9 : 0.35 }}
                            animate={reduce || lively ? undefined : { opacity: [0.35, 0.12, 0.35] }}
                            transition={{
                                duration: 3.2,
                                repeat: Infinity,
                                ease: "easeInOut",
                                delay: ((col * 7 + row * 3) % 10) * 0.28,
                            }}
                        />
                    );
                })}

                <path
                    ref={pathRef}
                    d={PATH_D}
                    fill="none"
                    stroke="currentColor"
                    strokeOpacity={0.25}
                    strokeWidth={1.5}
                    strokeDasharray="4 5"
                />

                <circle cx={TARGET.x} cy={TARGET.y} r={20} fill="none" stroke="currentColor" strokeOpacity={0.3} />
                <circle cx={TARGET.x} cy={TARGET.y} r={13} className="fill-muted" />
                <path
                    d={`M${TARGET.x - 6} ${TARGET.y} l4.5 4.5 l8 -9`}
                    fill="none"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="stroke-success"
                />

                <motion.circle cx={x} cy={y} r={8} fill="currentColor" />
                <motion.circle cx={x} cy={y} r={14} fill="none" stroke="currentColor" strokeOpacity={0.35} />
            </svg>
            <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                <span>Silent for 5+ days</span>
                <span>Picked up and followed up</span>
            </div>
        </div>
    );
}
