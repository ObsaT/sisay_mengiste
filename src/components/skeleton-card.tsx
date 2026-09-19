export function SkeletonCard({ variant = "default" }: { variant?: "default" | "horizontal" }) {
  if (variant === "horizontal") {
    return (
      <div className="flex animate-pulse gap-4">
        <div className="h-24 w-28 shrink-0 rounded-sm bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-16 rounded bg-muted" />
          <div className="h-4 w-full rounded bg-muted" />
          <div className="h-4 w-4/5 rounded bg-muted" />
          <div className="h-3 w-24 rounded bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-pulse">
      <div className="aspect-[16/9] rounded-sm bg-muted" />
      <div className="mt-3 space-y-2">
        <div className="h-3 w-16 rounded bg-muted" />
        <div className="h-5 w-full rounded bg-muted" />
        <div className="h-5 w-3/4 rounded bg-muted" />
        <div className="h-3 w-2/5 rounded bg-muted" />
      </div>
    </div>
  );
}

export function SkeletonHero() {
  return (
    <div className="animate-pulse grid gap-8 lg:grid-cols-[1.7fr_1fr]">
      {/* Featured */}
      <div className="min-h-[400px] rounded-md bg-muted" />
      {/* Side */}
      <div className="flex flex-col gap-5">
        {[...Array(3)].map((_, i) => (
          <SkeletonCard key={i} variant="horizontal" />
        ))}
      </div>
    </div>
  );
}
