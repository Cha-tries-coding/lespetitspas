import { Card } from "@/components/ui/card";

export default function ChildLoading() {
  return (
    <main className="max-w-4xl mx-auto px-4 pb-12 animate-in fade-in duration-300">
      {/* Back Button Skeleton */}
      <div className="mb-6">
        <div className="h-9 bg-muted rounded-xl w-40 animate-pulse" />
      </div>

      {/* Child Information Header Card Skeleton */}
      <Card className="p-6 border border-border/80 shadow-soleil rounded-2xl bg-card mb-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-start">
          <div className="flex justify-center">
            <div className="size-28 md:size-32 rounded-full bg-muted animate-pulse" />
          </div>

          <div className="flex-1 space-y-4 text-center md:text-left">
            <div className="space-y-2">
              <div className="flex flex-col items-center gap-2 md:flex-row md:items-baseline md:gap-3 justify-center md:justify-start">
                <div className="h-9 bg-muted rounded-xl w-48 animate-pulse" />
                <div className="h-6 bg-muted rounded-full w-20 animate-pulse" />
              </div>
              <div className="h-4 bg-muted rounded-lg w-32 animate-pulse mx-auto md:mx-0" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="h-12 bg-muted/65 rounded-xl w-full animate-pulse" />
              <div className="h-12 bg-muted/65 rounded-xl w-full animate-pulse" />
            </div>
          </div>
        </div>
      </Card>

      {/* Date Picker and Timeline Navigation Skeleton */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 bg-card border border-border p-4 rounded-xl shadow-soleil">
        <div className="h-6 bg-muted rounded-lg w-40 animate-pulse" />
        <div className="h-10 bg-muted rounded-xl w-64 animate-pulse" />
      </div>

      {/* Timeline Skeleton */}
      <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
        {[1, 2].map((i) => (
          <Card key={i} className="p-4 border border-border/80 shadow-soleil rounded-xl bg-card space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-5 bg-muted rounded-lg w-28 animate-pulse" />
              <div className="h-4 bg-muted rounded-lg w-12 animate-pulse" />
            </div>
            <div className="h-14 bg-muted/65 rounded-xl w-full animate-pulse" />
          </Card>
        ))}
      </div>
    </main>
  );
}
