import { cn } from "@/lib/utils";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type SoleilCardProps = React.ComponentProps<typeof Card>;

export function SoleilCard({ className, ...props }: SoleilCardProps) {
  return (
    <Card
      className={cn(
        "rounded-2xl border-border bg-card shadow-soleil transition-shadow hover:shadow-soleil-md",
        className,
      )}
      {...props}
    />
  );
}

export {
  CardContent as SoleilCardContent,
  CardDescription as SoleilCardDescription,
  CardFooter as SoleilCardFooter,
  CardHeader as SoleilCardHeader,
  CardTitle as SoleilCardTitle,
};
