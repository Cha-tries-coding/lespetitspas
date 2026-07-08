import { Card } from "@/components/ui/card";

export default function ParentLoading() {
  return (
    <main className="max-w-4xl mx-auto px-4 pb-12 animate-in fade-in duration-300">
      {/* Skeleton Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3 w-2/3">
          <div className="h-9 bg-muted rounded-xl w-1/3 animate-pulse" />
          <div className="h-5 bg-muted rounded-xl w-2/3 animate-pulse" />
        </div>
        <div className="h-10 bg-muted rounded-xl w-32 shrink-0 animate-pulse" />
      </div>

      {/* Skeleton Action Bar */}
      <div className="flex justify-end mb-8">
        <div className="h-11 bg-muted rounded-xl w-60 animate-pulse shadow-soleil" />
      </div>

      {/* Grid of Children Skeletons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <Card key={i} className="border border-border/80 shadow-soleil rounded-2xl overflow-hidden p-6 bg-card space-y-6">
            <div className="flex items-center gap-4">
              <div className="size-20 rounded-full bg-muted animate-pulse shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="h-5 bg-muted rounded-lg w-1/2 animate-pulse" />
                <div className="h-4 bg-muted rounded-lg w-1/4 animate-pulse" />
              </div>
            </div>
            
            <div className="space-y-2 pt-4 border-t border-border/40">
              <div className="h-4 bg-muted rounded-lg w-1/3 animate-pulse" />
              <div className="h-12 bg-muted rounded-xl w-full animate-pulse" />
            </div>
          </Card>
        ))}
      </div>
    </main>
  );
}
