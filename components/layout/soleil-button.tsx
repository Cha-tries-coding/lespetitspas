import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SoleilButtonProps = React.ComponentProps<typeof Button>;

export function SoleilButton({ className, ...props }: SoleilButtonProps) {
  return (
    <Button
      className={cn(
        "rounded-xl font-medium shadow-soleil transition-shadow hover:shadow-soleil-md",
        className,
      )}
      {...props}
    />
  );
}

export { buttonVariants };
