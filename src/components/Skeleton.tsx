"use client";

export function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl p-6" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
      <div className="h-4 w-24 rounded" style={{ backgroundColor: "var(--border-color)" }} />
      <div className="mt-3 h-8 w-20 rounded" style={{ backgroundColor: "var(--border-color)" }} />
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="animate-pulse rounded-2xl p-6" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
      <div className="h-5 w-40 rounded" style={{ backgroundColor: "var(--border-color)" }} />
      <div className="mt-6 flex items-end gap-3">
        {[40, 70, 55, 85, 30, 60].map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-t"
            style={{ height: `${h * 2.5}px`, backgroundColor: "var(--border-color)" }}
          />
        ))}
      </div>
    </div>
  );
}

export function SkeletonExpenseRow() {
  return (
    <div className="animate-pulse rounded-xl p-4" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg" style={{ backgroundColor: "var(--border-color)" }} />
          <div>
            <div className="h-4 w-32 rounded" style={{ backgroundColor: "var(--border-color)" }} />
            <div className="mt-2 h-3 w-20 rounded" style={{ backgroundColor: "var(--border-color)" }} />
          </div>
        </div>
        <div className="h-5 w-16 rounded" style={{ backgroundColor: "var(--border-color)" }} />
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <div className="mt-6">
        <SkeletonChart />
      </div>
      <div className="mt-6 space-y-2">
        <SkeletonExpenseRow />
        <SkeletonExpenseRow />
        <SkeletonExpenseRow />
      </div>
    </div>
  );
}

export function ExpenseListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <SkeletonExpenseRow key={i} />
      ))}
    </div>
  );
}
