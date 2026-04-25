"use client";

import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { EXPENSE_CATEGORIES } from "@/lib/validations";
import BudgetProgress from "@/components/BudgetProgress";

const CATEGORY_LABELS: Record<string, string> = {
  GROCERIES: "Groceries",
  DINING: "Dining",
  TRANSPORTATION: "Transportation",
  ENTERTAINMENT: "Entertainment",
  UTILITIES: "Utilities",
  HEALTHCARE: "Healthcare",
  SHOPPING: "Shopping",
  TRAVEL: "Travel",
  OTHER: "Other",
};

const CATEGORY_COLORS: Record<string, string> = {
  GROCERIES: "#00b894",
  DINING: "#e17055",
  TRANSPORTATION: "#74b9ff",
  ENTERTAINMENT: "#a29bfe",
  UTILITIES: "#fdcb6e",
  HEALTHCARE: "#ff6b6b",
  SHOPPING: "#e84393",
  TRAVEL: "#6c5ce7",
  OTHER: "#636e72",
};

interface Budget {
  id: string;
  category: string | null;
  amount: number;
}

interface CategorySpend {
  category: string;
  total: number;
}

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [spending, setSpending] = useState<CategorySpend[]>([]);
  const [totalSpent, setTotalSpent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [overallBudget, setOverallBudget] = useState("");
  const [categoryAmounts, setCategoryAmounts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const now = new Date();
    const [budgetRes, summaryRes] = await Promise.all([
      fetch("/api/budgets"),
      fetch(`/api/expenses/summary?year=${now.getFullYear()}&month=${now.getMonth() + 1}`),
    ]);

    const budgetData = await budgetRes.json();
    const summaryData = await summaryRes.json();

    setBudgets(budgetData.budgets || []);
    setSpending(summaryData.categories || []);
    setTotalSpent(summaryData.totalSpent || 0);

    // Initialize form values from existing budgets
    const overallBgt = (budgetData.budgets || []).find((b: Budget) => b.category === null);
    setOverallBudget(overallBgt ? overallBgt.amount.toString() : "");

    const catAmounts: Record<string, string> = {};
    for (const b of budgetData.budgets || []) {
      if (b.category) {
        catAmounts[b.category] = b.amount.toString();
      }
    }
    setCategoryAmounts(catAmounts);

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function saveBudget(category: string | null, amountStr: string) {
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount < 0) {
      toast.error("Enter a valid amount");
      return;
    }

    const key = category || "overall";
    setSaving(key);

    try {
      if (amount === 0) {
        await fetch("/api/budgets", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ category }),
        });
        // Remove from local state
        setBudgets((prev) => prev.filter((b) => b.category !== category));
        toast.success(`${category ? CATEGORY_LABELS[category] : "Overall"} budget removed`);
      } else {
        const res = await fetch("/api/budgets", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ category, amount }),
        });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || "Failed to save budget");
          setSaving(null);
          return;
        }
        // Update local state without refetching
        setBudgets((prev) => {
          const idx = prev.findIndex((b) => b.category === category);
          if (idx >= 0) {
            const updated = [...prev];
            updated[idx] = { ...updated[idx], amount };
            return updated;
          }
          return [...prev, data.budget];
        });
        toast.success(`${category ? CATEGORY_LABELS[category] : "Overall"} budget saved`);
      }
    } catch {
      toast.error("Failed to save budget");
    }

    setSaving(null);
  }

  function getBudgetForCategory(category: string): number {
    const b = budgets.find((b) => b.category === category);
    return b ? b.amount : 0;
  }

  function getSpentForCategory(category: string): number {
    const s = spending.find((s) => s.category === category);
    return s ? s.total : 0;
  }

  const overallBudgetAmount = budgets.find((b) => b.category === null)?.amount || 0;

  const inputClass = "w-24 rounded-lg border px-3 py-2 text-sm text-right";

  return (
    <div>
      <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Budgets</h1>
      <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
        Set monthly spending limits to stay on track.
      </p>

      {loading ? (
        <div className="mt-6 space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-2xl p-6" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
              <div className="h-4 w-32 rounded" style={{ backgroundColor: "var(--border-color)" }} />
              <div className="mt-3 h-2 w-full rounded" style={{ backgroundColor: "var(--border-color)" }} />
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {/* Overall budget */}
          <div className="rounded-2xl p-6" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Overall Monthly Budget</h2>
                <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
                  Total spending limit across all categories
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm" style={{ color: "var(--text-muted)" }}>S$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={overallBudget}
                  onChange={(e) => setOverallBudget(e.target.value)}
                  placeholder="0.00"
                  className={inputClass}
                />
                <button
                  onClick={() => saveBudget(null, overallBudget)}
                  disabled={saving === "overall"}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg, var(--accent-purple), var(--accent-pink))" }}
                >
                  {saving === "overall" ? "..." : "Save"}
                </button>
              </div>
            </div>
            {overallBudgetAmount > 0 && (
              <div className="mt-4">
                <BudgetProgress spent={totalSpent} budget={overallBudgetAmount} />
              </div>
            )}
          </div>

          {/* Category budgets */}
          <div className="rounded-2xl p-6" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
            <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Category Budgets</h2>
            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
              Set limits for individual categories. Enter 0 to remove a budget.
            </p>

            <div className="mt-5 space-y-4">
              {EXPENSE_CATEGORIES.map((cat) => {
                const spent = getSpentForCategory(cat);
                const budget = getBudgetForCategory(cat);

                return (
                  <div key={cat} className="rounded-xl p-4" style={{ backgroundColor: "var(--bg-primary)" }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: CATEGORY_COLORS[cat] }}
                        />
                        <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                          {CATEGORY_LABELS[cat]}
                        </span>
                        {spent > 0 && (
                          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                            S${spent.toFixed(2)} spent
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>S$</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={categoryAmounts[cat] || ""}
                          onChange={(e) => setCategoryAmounts({ ...categoryAmounts, [cat]: e.target.value })}
                          placeholder="0.00"
                          className="w-20 rounded-lg border px-2.5 py-1.5 text-sm text-right"
                        />
                        <button
                          onClick={() => saveBudget(cat, categoryAmounts[cat] || "0")}
                          disabled={saving === cat}
                          className="rounded-lg px-3 py-1.5 text-xs font-medium"
                          style={{ backgroundColor: "var(--bg-card-hover)", color: "var(--accent-purple)" }}
                        >
                          {saving === cat ? "..." : "Set"}
                        </button>
                      </div>
                    </div>
                    {budget > 0 && (
                      <div className="mt-3">
                        <BudgetProgress spent={spent} budget={budget} size="sm" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
