"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EASE } from "../lib/motion";
import { HeroVisual } from "./hero-visual";

export function Hero() {
    const reduce = useReducedMotion();
    const item = {
        hidden: { opacity: 0, y: reduce ? 0 : 12 },
        show: { opacity: 1, y: 0, transition: { duration: reduce ? 0.01 : 0.5, ease: EASE } },
    };

    return (
        <section className="relative overflow-hidden border-b">
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(var(--border)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_70%_80%_at_50%_40%,black,transparent)] bg-size-[24px_24px]"
            />
            <div className="relative mx-auto grid w-full max-w-6xl items-center gap-12 px-6 py-16 md:py-24 lg:grid-cols-2 lg:gap-16">
                <motion.div
                    initial="hidden"
                    animate="show"
                    variants={{ show: { transition: { staggerChildren: reduce ? 0 : 0.08 } } }}
                    className="flex flex-col items-start"
                >
                    <motion.div variants={item}>
                        <Badge variant="outline" className="h-6 px-2.5 text-muted-foreground">
                            For NIAT admissions
                        </Badge>
                    </motion.div>
                    <motion.h1
                        variants={item}
                        className="mt-5 font-heading text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl"
                    >
                        Win back the students who went quiet.
                    </motion.h1>
                    <motion.p variants={item} className="mt-5 max-w-lg text-base text-pretty text-muted-foreground">
                        An AI agent finds stalled leads, works out why they went silent and drafts an evidence-backed
                        follow-up that goes out only after a counsellor approves it.
                    </motion.p>
                    <motion.div variants={item} className="mt-8 flex flex-wrap items-center gap-3">
                        <Button size="lg" className="px-4" nativeButton={false} render={<Link href="/dashboard" />}>
                            Open the dashboard
                            <ArrowRight data-icon="inline-end" aria-hidden />
                        </Button>
                        <Button
                            size="lg"
                            variant="outline"
                            className="px-4"
                            nativeButton={false}
                            render={<a href="#how-it-works" />}
                        >
                            See how it works
                        </Button>
                    </motion.div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: reduce ? 0 : 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: reduce ? 0.01 : 0.6, delay: reduce ? 0 : 0.2, ease: EASE }}
                >
                    <HeroVisual />
                </motion.div>
            </div>
        </section>
    );
}
