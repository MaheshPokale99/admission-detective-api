"use client";

import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";
import { EASE, VIEWPORT } from "../lib/motion";

interface RevealProps extends Omit<HTMLMotionProps<"div">, "variants" | "initial" | "animate" | "whileInView"> {
    delay?: number;
    y?: number;
}

/** Fades and lifts its children into place the first time they scroll into view. */
export function Reveal({ delay = 0, y = 10, ...props }: RevealProps) {
    const reduce = useReducedMotion();
    return (
        <motion.div
            initial={reduce ? false : { opacity: 0, y }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={VIEWPORT}
            transition={{ duration: 0.5, delay, ease: EASE }}
            {...props}
        />
    );
}

/** Staggers `RevealItem` children as the group scrolls into view. */
export function RevealGroup({ step = 0.07, ...props }: Omit<HTMLMotionProps<"div">, "variants"> & { step?: number }) {
    const reduce = useReducedMotion();
    return (
        <motion.div
            initial={reduce ? false : "hidden"}
            whileInView="show"
            viewport={VIEWPORT}
            variants={{ show: { transition: { staggerChildren: step } } }}
            {...props}
        />
    );
}

export function RevealItem({ y = 10, ...props }: Omit<HTMLMotionProps<"div">, "variants"> & { y?: number }) {
    return (
        <motion.div
            variants={{
                hidden: { opacity: 0, y },
                show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
            }}
            {...props}
        />
    );
}
