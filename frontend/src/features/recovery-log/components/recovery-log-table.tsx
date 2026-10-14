"use client";

import Link from "next/link";
import { InterventionBadge, OutcomeBadge, ToneBadge } from "@/components/common/status-badges";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { InterventionRow } from "@/lib/api";
import { ACTION_LABEL, REASON_LABEL } from "@/lib/labels";
import { dateTime } from "@/lib/time";

function OutcomeCell({ row }: { row: InterventionRow }) {
    if (row.status !== "sent") return <span className="text-muted-foreground">-</span>;
    const latest = row.outcomes.at(-1);
    if (!latest) return <span className="text-muted-foreground">Waiting for a reply</span>;
    return <OutcomeBadge type={latest.type} />;
}

function RecoveryLogHeader() {
    return (
        <TableHeader>
            <TableRow>
                <TableHead className="pl-4">Lead</TableHead>
                <TableHead>Action</TableHead>
                <TableHead className="hidden md:table-cell">Reason</TableHead>
                <TableHead>Decision</TableHead>
                <TableHead>Outcome</TableHead>
                <TableHead className="hidden pr-4 text-right lg:table-cell">When</TableHead>
            </TableRow>
        </TableHeader>
    );
}

export function RecoveryLogTable({ rows }: { rows: InterventionRow[] }) {
    return (
        <Table>
            <RecoveryLogHeader />
            <TableBody>
                {rows.map((row) => {
                    const when = dateTime(row.sentAt ?? row.reviewedAt ?? row.createdAt);
                    return (
                        <TableRow key={row.id}>
                            <TableCell className="pl-4">
                                <Link
                                    href={`/leads/${row.leadId}`}
                                    className="rounded-sm font-medium outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
                                >
                                    {row.lead?.name ?? "Unknown lead"}
                                </Link>
                                <p className="text-xs text-muted-foreground lg:hidden">{when}</p>
                            </TableCell>
                            <TableCell>{ACTION_LABEL[row.action]}</TableCell>
                            <TableCell className="hidden text-muted-foreground md:table-cell">
                                {row.primaryCategory ? REASON_LABEL[row.primaryCategory] : "-"}
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-wrap items-center gap-1.5">
                                    <InterventionBadge status={row.status} />
                                    {row.edited && <ToneBadge tone="info">Edited</ToneBadge>}
                                </div>
                            </TableCell>
                            <TableCell>
                                <OutcomeCell row={row} />
                            </TableCell>
                            <TableCell className="hidden pr-4 text-right text-muted-foreground lg:table-cell">
                                {when}
                            </TableCell>
                        </TableRow>
                    );
                })}
            </TableBody>
        </Table>
    );
}

export function RecoveryLogTableSkeleton() {
    return (
        <Table aria-hidden>
            <RecoveryLogHeader />
            <TableBody>
                {Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell className="pl-4">
                            <Skeleton className="h-4 w-28" />
                        </TableCell>
                        <TableCell>
                            <Skeleton className="h-4 w-28" />
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                            <Skeleton className="h-4 w-24" />
                        </TableCell>
                        <TableCell>
                            <Skeleton className="h-5 w-16" />
                        </TableCell>
                        <TableCell>
                            <Skeleton className="h-5 w-24" />
                        </TableCell>
                        <TableCell className="hidden pr-4 lg:table-cell">
                            <Skeleton className="ml-auto h-4 w-24" />
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
