"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { ChildCard } from "@/components/staff/child-card";
import { SoleilButton } from "@/components/layout/soleil-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ALL_SECTIONS_FILTER,
  SECTION_FILTERS,
  type SectionFilter,
} from "@/lib/children/constants";
import type { Child } from "@/lib/children/queries";
import { cn } from "@/lib/utils";

type ChildrenGridProps = {
  items: Child[];
};

function normalizeSearchValue(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function matchesSearch(child: Child, query: string) {
  if (!query) {
    return true;
  }

  const haystack = normalizeSearchValue(
    `${child.first_name} ${child.last_name}`,
  );

  return haystack.includes(query);
}

function matchesSection(child: Child, sectionFilter: SectionFilter) {
  if (sectionFilter === ALL_SECTIONS_FILTER) {
    return true;
  }

  return child.section === sectionFilter;
}

export function ChildrenGrid({ items }: ChildrenGridProps) {
  const [search, setSearch] = useState("");
  const [sectionFilter, setSectionFilter] =
    useState<SectionFilter>(ALL_SECTIONS_FILTER);

  const normalizedSearch = normalizeSearchValue(search);

  const filteredChildren = useMemo(
    () =>
      items.filter(
        (child) =>
          matchesSearch(child, normalizedSearch) &&
          matchesSection(child, sectionFilter),
      ),
    [items, normalizedSearch, sectionFilter],
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-soleil sm:p-5">
        <div className="flex flex-col gap-2">
          <Label htmlFor="child-search">Rechercher un enfant</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="child-search"
              type="search"
              placeholder="Nom ou prénom..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="h-10 rounded-xl bg-background pl-9"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">Section</span>
          <div className="flex flex-wrap gap-2">
            {SECTION_FILTERS.map((section) => {
              const isActive = sectionFilter === section;

              return (
                <SoleilButton
                  key={section}
                  type="button"
                  size="sm"
                  variant={isActive ? "default" : "outline"}
                  className={cn("rounded-full", !isActive && "shadow-none")}
                  onClick={() => setSectionFilter(section)}
                  aria-pressed={isActive}
                >
                  {section}
                </SoleilButton>
              );
            })}
          </div>
        </div>
      </div>

      {filteredChildren.length > 0 ? (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredChildren.map((child) => (
            <li key={child.id}>
              <ChildCard child={child} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-12 text-center shadow-soleil">
          <p className="font-heading text-lg">Aucun enfant trouvé</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Modifiez votre recherche ou changez de section.
          </p>
        </div>
      )}
    </div>
  );
}
