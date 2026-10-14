"use client";

import { Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LEAD_FILTERS, type LeadFilterId } from "../lib/filters";

interface LeadFiltersProps {
    filter: LeadFilterId;
    onFilterChange: (filter: LeadFilterId) => void;
    counts: Record<LeadFilterId, number> | null;
    query: string;
    onQueryChange: (query: string) => void;
}

export function LeadFilters({ filter, onFilterChange, counts, query, onQueryChange }: LeadFiltersProps) {
    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="overflow-x-auto">
                <Tabs value={filter} onValueChange={(value) => onFilterChange(value as LeadFilterId)}>
                    <TabsList aria-label="Filter leads by status" className="h-9 w-max">
                        {LEAD_FILTERS.map((f) => (
                            <TabsTrigger key={f.id} value={f.id} className="gap-2 px-3">
                                {f.label}
                                {counts && (
                                    <Badge
                                        variant={filter === f.id ? "default" : "secondary"}
                                        className="h-4 min-w-5 px-1.5 tabular-nums"
                                    >
                                        {counts[f.id]}
                                    </Badge>
                                )}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>
            </div>
            <InputGroup className="sm:max-w-72">
                <InputGroupAddon>
                    <Search aria-hidden />
                </InputGroupAddon>
                <InputGroupInput
                    type="search"
                    value={query}
                    onChange={(e) => onQueryChange(e.target.value)}
                    placeholder="Search name, city, counsellor"
                    aria-label="Search leads"
                />
                {query && (
                    <InputGroupAddon align="inline-end">
                        <InputGroupButton size="icon-xs" aria-label="Clear search" onClick={() => onQueryChange("")}>
                            <X />
                        </InputGroupButton>
                    </InputGroupAddon>
                )}
            </InputGroup>
        </div>
    );
}
