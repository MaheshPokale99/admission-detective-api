"use client";

import {
    animate,
    motion,
    useInView,
    useMotionValue,
    useReducedMotion,
    useTransform,
    type HTMLMotionProps,
} from "framer-motion";
import { useEffect, useRef } from "react";

const ease = [0.22, 1, 0.36, 1] as const;

export function FadeIn({ delay = 0, y = 12, ...props }: HTMLMotionProps<"div"> & { delay?: number; y?: number }) {
    const reduce = useReducedMotion();
    return (
        <motion.div
            initial={{ opacity: 0, y: reduce ? 0 : y }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduce ? 0.01 : 0.45, delay: reduce ? 0 : delay, ease }}
            {...props}
        />
    );
}

export function Stagger({
    children,
    className,
    step = 0.06,
}: {
    children: React.ReactNode;
    className?: string;
    step?: number;
}) {
    const reduce = useReducedMotion();
    return (
        <motion.div
            className={className}
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: reduce ? 0 : step } } }}
        >
            {children}
        </motion.div>
    );
}

export function Item({ className, children }: { className?: string; children: React.ReactNode }) {
    const reduce = useReducedMotion();
    return (
        <motion.div
            className={className}
            variants={{
                hidden: { opacity: 0, y: reduce ? 0 : 14 },
                show: { opacity: 1, y: 0, transition: { duration: reduce ? 0.01 : 0.4, ease } },
            }}
        >
            {children}
        </motion.div>
    );
}

/** Counts up to `value` the first time it scrolls into view. */
export function CountUp({ value, suffix = "" }: { value: number; suffix?: string }) {
    const ref = useRef<HTMLSpanElement>(null);
    const inView = useInView(ref, { once: true });
    const reduce = useReducedMotion();
    const mv = useMotionValue(0);
    const text = useTransform(mv, (v) => `${Math.round(v)}${suffix}`);

    useEffect(() => {
        if (!inView) return;
        if (reduce) {
            mv.set(value);
            return;
        }
        const controls = animate(mv, value, { duration: 0.9, ease });
        return () => controls.stop();
    }, [inView, value, mv, reduce]);

    return <motion.span ref={ref}>{text}</motion.span>;
}
