"use client";

import { motion } from "framer-motion";
import { ChevronRight, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { StageBadge, StatusBadge } from "@/components/common/status-badges";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { LeadSummary } from "@/lib/api";
import { initials } from "@/lib/strings";
import { timeAgo } from "@/lib/time";

const MotionRow = motion.create(TableRow);

function RadarHead() {
    return (
        <TableHeader>
            <TableRow className="hover:bg-transparent">
                <TableHead className="pl-4">Lead</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead className="text-right">Silent for</TableHead>
                <TableHead className="min-w-32">Potential</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden xl:table-cell">Last activity</TableHead>
                <TableHead className="w-10 pr-4">
                    <span className="sr-only">Open</span>
                </TableHead>
            </TableRow>
        </TableHeader>
    );
}

interface LeadRadarTableProps {
    leads: LeadSummary[];
    total: number;
}

export function LeadRadarTable({ leads, total }: LeadRadarTableProps) {
    return (
        <Card className="gap-0 pb-0">
            <CardHeader className="border-b">
                <CardTitle>Stalled leads</CardTitle>
                <CardDescription>Ranked by recovery potential. Select a row to open the case file.</CardDescription>
            </CardHeader>
            <Table>
                <RadarHead />
                <TableBody>
                    {leads.map((lead, index) => (
                        <LeadRow key={lead.id} lead={lead} index={index} />
                    ))}
                </TableBody>
            </Table>
            <CardFooter className="text-xs text-muted-foreground">
                Showing {leads.length} of {total} {total === 1 ? "lead" : "leads"}
            </CardFooter>
        </Card>
    );
}

function LeadRow({ lead, index }: { lead: LeadSummary; index: number }) {
    return (
        <MotionRow
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: Math.min(index * 0.025, 0.3) }}
            className="group relative"
        >
            <TableCell className="py-3 pl-4">
                <Link
                    href={`/leads/${lead.id}`}
                    className="flex items-center gap-3 outline-none after:absolute after:inset-0 focus-visible:after:ring-2 focus-visible:after:ring-ring focus-visible:after:ring-inset"
                >
                    <Avatar>
                        <AvatarFallback>{initials(lead.name)}</AvatarFallback>
                    </Avatar>
                    <span className="min-w-0">
                        <span className="block truncate font-medium">{lead.name}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                            {[lead.city, lead.counsellor].filter(Boolean).join(" · ")}
                        </span>
                    </span>
                </Link>
            </TableCell>
            <TableCell>
                <StageBadge stage={lead.stage} />
            </TableCell>
            <TableCell className="text-right tabular-nums">{lead.daysInactive}d</TableCell>
            <TableCell>
                <Potential lead={lead} />
            </TableCell>
            <TableCell>
                <div className="flex items-center gap-1.5">
                    <StatusBadge status={lead.status} />
                    {lead.status === "protected" && <ProtectedHint reasons={lead.protectedReasons} />}
                </div>
            </TableCell>
            <TableCell className="hidden max-w-64 xl:table-cell">
                {lead.lastMessage ? (
                    <span className="block truncate text-muted-foreground" title={lead.lastMessage.preview}>
                        <span className="text-xs">{timeAgo(lead.lastActivityAt)} · </span>
                        {lead.lastMessage.preview}
                    </span>
                ) : (
                    <span className="text-muted-foreground">No messages</span>
                )}
            </TableCell>
            <TableCell className="pr-4">
                <ChevronRight
                    aria-hidden
                    className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                />
            </TableCell>
        </MotionRow>
    );
}

function Potential({ lead }: { lead: LeadSummary }) {
    if (!lead.stalled) return <span className="text-muted-foreground">Not stalled</span>;
    return (
        <div className="flex items-center gap-2">
            <Progress
                value={lead.recoveryScore}
                aria-label={`Recovery potential ${lead.recoveryScore} out of 100`}
                className="w-16 gap-0"
            />
            <span className="w-6 text-right text-sm tabular-nums">{lead.recoveryScore}</span>
        </div>
    );
}

function ProtectedHint({ reasons }: { reasons: string[] }) {
    return (
        <Tooltip>
            <TooltipTrigger
                aria-label={`Outreach locked: ${reasons.join("; ")}`}
                className="relative z-10 rounded-sm text-destructive outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
                <ShieldAlert className="size-4" />
            </TooltipTrigger>
            <TooltipContent className="block">
                <p className="mb-1 font-medium">Outreach locked</p>
                <ul className="list-disc space-y-0.5 pl-4">
                    {reasons.map((reason) => (
                        <li key={reason}>{reason}</li>
                    ))}
                </ul>
            </TooltipContent>
        </Tooltip>
    );
}

export function LeadRadarSkeleton() {
    return (
        <Card className="gap-0 pb-0" aria-busy aria-label="Loading leads">
            <CardHeader className="border-b">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-72 max-w-full" />
            </CardHeader>
            <Table>
                <RadarHead />
                <TableBody>
                    {Array.from({ length: 6 }).map((_, i) => (
                        <TableRow key={i} className="hover:bg-transparent">
                            <TableCell className="py-3 pl-4">
                                <div className="flex items-center gap-3">
                                    <Skeleton className="size-8 rounded-full" />
                                    <div className="space-y-1.5">
                                        <Skeleton className="h-4 w-32" />
                                        <Skeleton className="h-3 w-24" />
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>
                                <Skeleton className="h-5 w-20 rounded-full" />
                            </TableCell>
                            <TableCell>
                                <Skeleton className="ml-auto h-4 w-8" />
                            </TableCell>
                            <TableCell>
                                <Skeleton className="h-4 w-24" />
                            </TableCell>
                            <TableCell>
                                <Skeleton className="h-5 w-28 rounded-full" />
                            </TableCell>
                            <TableCell className="hidden xl:table-cell">
                                <Skeleton className="h-4 w-48" />
                            </TableCell>
                            <TableCell />
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Card>
    );
}
