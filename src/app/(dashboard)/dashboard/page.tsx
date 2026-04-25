"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import CategoryChart from "@/components/CategoryChart";
import TrendChart from "@/components/TrendChart";
import BudgetProgress from "@/components/BudgetProgress";
import { DashboardSkeleton } from "@/components/Skeleton";
import { getCurrencySymbol } from "@/lib/currencies";

const CATEGORY_LABELS: Record<string, string> = {
  GROCERIES: "Groceries",
  DINING: "Dining",
  TRANSPORTATION: "Transport",
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

interface CategorySummary {
  category: string;
  total: number;
  count: number;
}

interface Summary {
  categories: CategorySummary[];
  totalSpent: number;
  expenseCount: number;
}

interface Budget {
  id: string;
  category: string | null;
  amount: number;
}

interface TrendData {
  month: string;
  label: string;
  total: number;
  categories: Record<string, number>;
}

interface Expense {
  id: string;
  merchant: string;
  amount: number;
  quantity: number;
  currency: string;
  date: string;
  category: string;
  description: string | null;
}

export default function DashboardPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);

  const monthStr = `${year}-${String(month).padStart(2, "0")}`;
  const monthLabel = new Date(year, month - 1).toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  const fetchData = useCallback(async () => {
    setLoading(true);

    const safeJson = async (res: Response) => {
      try {
        const text = await res.text();
        return text ? JSON.parse(text) : {};
      } catch {
        return {};
      }
    };

    const [summaryRes, expensesRes, budgetRes, trendsRes] = await Promise.all([
      fetch(`/api/expenses/summary?year=${year}&month=${month}`),
      fetch(`/api/expenses?month=${monthStr}&limit=5`),
      fetch("/api/budgets"),
      fetch("/api/expenses/trends?months=6"),
    ]);

    const [summaryData, expensesData, budgetData, trendsData] = await Promise.all([
      safeJson(summaryRes),
      safeJson(expensesRes),
      safeJson(budgetRes),
      safeJson(trendsRes),
    ]);

    setSummary(summaryData);
    setRecentExpenses(expensesData.expenses || []);
    setBudgets(budgetData.budgets || []);
    setTrends(trendsData.trends || []);
    setLoading(false);
  }, [year, month, monthStr]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function prevMonth() {
    if (month === 1) { setYear(year - 1); setMonth(12); }
    else { setMonth(month - 1); }
  }

  function nextMonth() {
    if (month === 12) { setYear(year + 1); setMonth(1); }
    else { setMonth(month + 1); }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Dashboard</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>Your spending overview</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="rounded-lg border px-3 py-1.5 text-sm transition-colors"
            style={{ borderColor: "var(--border-color)", color: "var(--text-secondary)", backgroundColor: "var(--bg-card)" }}
          >
            &larr;
          </button>
          <span className="min-w-[140px] text-center text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            {monthLabel}
          </span>
          <button
            onClick={nextMonth}
            className="rounded-lg border px-3 py-1.5 text-sm transition-colors"
            style={{ borderColor: "var(--border-color)", color: "var(--text-secondary)", backgroundColor: "var(--bg-card)" }}
          >
            &rarr;
          </button>
        </div>
      </div>

      {loading ? (
        <div className="mt-6"><DashboardSkeleton /></div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl p-6" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>Total This Month</p>
              <div className="mt-2 flex items-baseline gap-2">
                <p className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>
                  S${(summary?.totalSpent || 0).toFixed(2)}
                </p>
                {(() => {
                  if (trends.length < 2) return null;
                  const currentMonth = `${year}-${String(month).padStart(2, "0")}`;
                  const currentIdx = trends.findIndex((t) => t.month === currentMonth);
                  if (currentIdx < 1) return null;
                  const prev = trends[currentIdx - 1].total;
                  if (prev === 0) return null;
                  const delta = ((summary?.totalSpent || 0) - prev) / prev * 100;
                  const isUp = delta > 0;
                  return (
                    <span className="text-xs font-semibold" style={{ color: isUp ? "var(--accent-red)" : "var(--accent-green)" }}>
                      {isUp ? "\u2191" : "\u2193"}{Math.abs(delta).toFixed(0)}%
                    </span>
                  );
                })()}
              </div>
              <div className="mt-2">
                {(() => {
                  const overallBudget = budgets.find((b) => b.category === null);
                  if (overallBudget) {
                    return <BudgetProgress spent={summary?.totalSpent || 0} budget={overallBudget.amount} size="sm" />;
                  }
                  return (
                    <Link href="/budgets" className="text-xs hover:underline" style={{ color: "var(--accent-purple)" }}>
                      Set a budget &rarr;
                    </Link>
                  );
                })()}
              </div>
            </div>
            <div className="rounded-2xl p-6" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>Expenses</p>
              <p className="mt-2 text-3xl font-bold" style={{ color: "var(--text-primary)" }}>
                {summary?.expenseCount || 0}
              </p>
              <p className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>transactions this month</p>
            </div>
            <div className="rounded-2xl p-6" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>Categories</p>
              <p className="mt-2 text-3xl font-bold" style={{ color: "var(--text-primary)" }}>
                {summary?.categories.length || 0}
              </p>
              <div className="mt-2 flex gap-1">
                {(summary?.categories || []).slice(0, 5).map((cat) => (
                  <div
                    key={cat.category}
                    className="h-2 flex-1 rounded-full"
                    style={{ backgroundColor: CATEGORY_COLORS[cat.category] || CATEGORY_COLORS.OTHER }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="mt-6 rounded-2xl p-6" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
            <h2 className="mb-4 text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
              Spending by Category
            </h2>
            <CategoryChart data={summary?.categories || []} />
          </div>

          {/* Spending Trends */}
          <div className="mt-6 rounded-2xl p-6" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
            <h2 className="mb-4 text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
              Spending Trends
            </h2>
            <TrendChart data={trends} />
          </div>

          {/* Category budget progress */}
          {budgets.filter((b) => b.category !== null).length > 0 && (
            <div className="mt-6 rounded-2xl p-6" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Budget Progress</h2>
                <Link href="/budgets" className="text-sm font-medium hover:underline" style={{ color: "var(--accent-purple)" }}>
                  Manage
                </Link>
              </div>
              <div className="mt-4 space-y-3">
                {budgets
                  .filter((b) => b.category !== null)
                  .map((b) => {
                    const spent = summary?.categories.find((c) => c.category === b.category)?.total || 0;
                    return (
                      <div key={b.id}>
                        <div className="mb-1 flex items-center gap-2">
                          <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[b.category!] || CATEGORY_COLORS.OTHER }} />
                          <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                            {CATEGORY_LABELS[b.category!] || b.category}
                          </span>
                        </div>
                        <BudgetProgress spent={spent} budget={b.amount} size="sm" />
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Recent expenses */}
          <div className="mt-6 rounded-2xl p-6" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                Recent Expenses
              </h2>
              <Link href="/expenses" className="text-sm font-medium hover:underline" style={{ color: "var(--accent-purple)" }}>
                View all
              </Link>
            </div>

            {recentExpenses.length === 0 ? (
              <div className="mt-4 py-8 text-center">
                <p style={{ color: "var(--text-muted)" }}>No expenses this month.</p>
                <div className="mt-3 flex justify-center gap-3">
                  <Link
                    href="/expenses"
                    className="rounded-lg px-4 py-2 text-sm font-medium text-white"
                    style={{ background: "linear-gradient(135deg, var(--accent-purple), var(--accent-pink))" }}
                  >
                    Go to Expenses
                  </Link>
                  <Link
                    href="/expenses/new"
                    className="rounded-lg border px-4 py-2 text-sm font-medium"
                    style={{ borderColor: "var(--border-color)", color: "var(--text-secondary)" }}
                  >
                    Add Manually
                  </Link>
                </div>
              </div>
            ) : (
              <div className="mt-4 space-y-2">
                {recentExpenses.map((expense) => (
                  <div
                    key={expense.id}
                    className="flex items-center justify-between rounded-xl p-3 transition-colors"
                    style={{ backgroundColor: "var(--bg-input)" }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-xs font-bold text-white"
                        style={{ backgroundColor: CATEGORY_COLORS[expense.category] || CATEGORY_COLORS.OTHER }}
                      >
                        {CATEGORY_LABELS[expense.category]?.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                          {expense.merchant}
                        </p>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                          {new Date(expense.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                      {getCurrencySymbol(expense.currency)}{(expense.amount * expense.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
