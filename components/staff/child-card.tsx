import Link from "next/link";

import { ChildAvatar } from "@/components/staff/child-avatar";
import { SectionBadge } from "@/components/staff/section-badge";
import {
  SoleilCard,
  SoleilCardContent,
  SoleilCardHeader,
  SoleilCardTitle,
} from "@/components/layout/soleil-card";
import type { Child } from "@/lib/children/queries";
import { getChildDisplayName } from "@/components/staff/child-avatar";
import { cn } from "@/lib/utils";

type ChildCardProps = {
  child: Child;
  className?: string;
};

export function ChildCard({ child, className }: ChildCardProps) {
  return (
    <Link
      href={`/staff/children/${child.id}`}
      className={cn("group block h-full outline-none", className)}
    >
      <SoleilCard className="h-full transition-transform group-hover:-translate-y-0.5 group-focus-visible:ring-3 group-focus-visible:ring-ring/50">
        <SoleilCardHeader className="items-center text-center">
          <ChildAvatar child={child} />
          <SoleilCardTitle className="mt-3 text-lg">
            {child.first_name}
          </SoleilCardTitle>
          <p className="text-sm text-muted-foreground">{child.last_name}</p>
        </SoleilCardHeader>
        <SoleilCardContent className="flex justify-center pb-4">
          <SectionBadge section={child.section} />
        </SoleilCardContent>
      </SoleilCard>
      <span className="sr-only">
        Voir la fiche de {getChildDisplayName(child)}
      </span>
    </Link>
  );
}
