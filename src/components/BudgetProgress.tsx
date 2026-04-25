"use client";

interface BudgetProgressProps {
  spent: number;
  budget: number;
  showLabel?: boolean;
  size?: "sm" | "md";
}

export default function BudgetProgress({ spent, budget, showLabel = true, size = "md" }: BudgetProgressProps) {
  const percentage = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
  const overBudget = spent > budget && budget > 0;

  let barColor: string;
  if (overBudget) {
    barColor = "var(--accent-red)";
  } else if (percentage > 75) {
    barColor = "var(--accent-yellow)";
  } else {
    barColor = "var(--accent-green)";
  }

  const height = size === "sm" ? "h-1.5" : "h-2";

  return (
    <div>
      <div className={`w-full rounded-full ${height}`} style={{ backgroundColor: "var(--border-color)" }}>
        <div
          className={`rounded-full ${height} transition-all duration-500`}
          style={{ width: `${percentage}%`, backgroundColor: barColor }}
        />
      </div>
      {showLabel && budget > 0 && (
        <div className="mt-1 flex items-center justify-between">
          <span className="text-xs" style={{ color: overBudget ? "var(--accent-red)" : "var(--text-muted)" }}>
            {overBudget ? `Over by $${(spent - budget).toFixed(2)}` : `${percentage.toFixed(0)}% used`}
          </span>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            ${spent.toFixed(2)} / ${budget.toFixed(2)}
          </span>
        </div>
      )}
    </div>
  );
}
