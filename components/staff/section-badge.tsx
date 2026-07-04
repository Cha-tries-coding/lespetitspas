import type { ChildSection } from "@/lib/children/constants";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const SECTION_BADGE_VARIANT: Record<
  ChildSection,
  "default" | "secondary" | "outline"
> = {
  Bébés: "default",
  Moyens: "secondary",
  Grands: "outline",
};

type SectionBadgeProps = {
  section: string;
  className?: string;
};

export function SectionBadge({ section, className }: SectionBadgeProps) {
  const variant =
    section in SECTION_BADGE_VARIANT
      ? SECTION_BADGE_VARIANT[section as ChildSection]
      : "outline";

  return (
    <Badge variant={variant} className={cn("rounded-full px-2.5", className)}>
      {section}
    </Badge>
  );
}
