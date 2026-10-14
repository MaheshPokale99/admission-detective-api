"use client";

import { useTransform, type MotionValue } from "framer-motion";
import type { RefObject } from "react";

/** Maps a 0-1 progress value to x/y coordinates along an SVG path. */
export function usePathPoint(pathRef: RefObject<SVGPathElement | null>, progress: MotionValue<number>) {
    const at = (p: number) => pathRef.current?.getPointAtLength(p * pathRef.current.getTotalLength());
    const x = useTransform(progress, (p) => at(p)?.x ?? 0);
    const y = useTransform(progress, (p) => at(p)?.y ?? 0);
    return { x, y };
}
