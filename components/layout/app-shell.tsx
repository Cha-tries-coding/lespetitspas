import { cn } from "@/lib/utils";

type AppShellProps = {
  children: React.ReactNode;
  className?: string;
};

export function AppShell({ children, className }: AppShellProps) {
  return (
    <div className="flex min-h-full flex-col bg-background">
      <div
        className={cn(
          "mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-6 sm:px-6 sm:py-8",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}
