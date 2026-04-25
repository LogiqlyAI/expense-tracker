"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { EXPENSE_CATEGORIES } from "@/lib/validations";
import { CURRENCIES, getCurrencySymbol } from "@/lib/currencies";
import { ExpenseListSkeleton } from "@/components/Skeleton";
import ScanModal from "@/components/ScanModal";

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

const CATEGORY_DOT_COLORS: Record<string, string> = {
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

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Expense>>({});
  const [scanOpen, setScanOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchMode, setSearchMode] = useState(false);
  const [searchFilters, setSearchFilters] = useState<Record<string, string | number>>({});

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (month) params.set("month", month);
    if (category) params.set("category", category);

    const res = await fetch(`/api/expenses?${params}`);
    const data = await res.json();
    setExpenses(data.expenses);
    setPagination(data.pagination);
    setLoading(false);
  }, [month, category, page]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this expense?")) return;
    await fetch(`/api/expenses/${id}`, { method: "DELETE" });
    toast.success("Expense deleted");
    fetchExpenses();
  }

  function startEdit(expense: Expense) {
    setEditingId(expense.id);
    setEditForm({
      merchant: expense.merchant,
      amount: expense.amount,
      quantity: expense.quantity,
      currency: expense.currency,
      date: expense.date.split("T")[0],
      category: expense.category,
      description: expense.description || "",
    });
  }

  async function saveEdit(id: string) {
    const res = await fetch(`/api/expenses/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        merchant: editForm.merchant,
        amount: Number(editForm.amount),
        quantity: Number(editForm.quantity) || 1,
        currency: editForm.currency || "SGD",
        date: editForm.date,
        category: editForm.category,
        description: editForm.description || undefined,
      }),
    });

    if (res.ok) {
      setEditingId(null);
      toast.success("Expense updated");
      fetchExpenses();
    } else {
      toast.error("Failed to update expense");
    }
  }

  function exportCSV() {
    if (expenses.length === 0) return;
    const header = "Merchant,Amount,Quantity,Total,Currency,Date,Category,Description";
    const rows = expenses.map((e) =>
      [
        `"${e.merchant.replace(/"/g, '""')}"`,
        e.amount.toFixed(2),
        e.quantity,
        (e.amount * e.quantity).toFixed(2),
        e.currency,
        e.date.split("T")[0],
        e.category,
        `"${(e.description || "").replace(/"/g, '""')}"`,
      ].join(",")
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `expenses-${month}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported to CSV");
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!searchQuery.trim()) {
      clearSearch();
      return;
    }
    setSearching(true);
    try {
      const res = await fetch("/api/expenses/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setExpenses(data.expenses);
        setPagination(null);
        setSearchMode(true);
        setSearchFilters(data.filters || {});
      }
    } catch {
      toast.error("Search failed");
    }
    setSearching(false);
  }

  function clearSearch() {
    setSearchQuery("");
    setSearchMode(false);
    setSearchFilters({});
    fetchExpenses();
  }

  const FILTER_LABELS: Record<string, string> = {
    merchant: "Merchant",
    category: "Category",
    dateFrom: "From",
    dateTo: "To",
    amountMin: "Min $",
    amountMax: "Max $",
  };

  const inputClass = "rounded-lg border px-2.5 py-1.5 text-sm";

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Expenses</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            {pagination ? `${pagination.total} transaction${pagination.total !== 1 ? "s" : ""}` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportCSV}
            disabled={expenses.length === 0}
            className="rounded-lg border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-40"
            style={{ borderColor: "var(--border-color)", color: "var(--text-secondary)" }}
          >
            Export CSV
          </button>
          <button
            onClick={() => setScanOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium transition-colors"
            style={{ borderColor: "var(--accent-teal)", color: "var(--accent-teal)" }}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Scan Receipt
          </button>
          <Link
            href="/expenses/new"
            className="rounded-lg px-4 py-2 text-sm font-medium text-white"
            style={{ background: "linear-gradient(135deg, var(--accent-purple), var(--accent-pink))" }}
          >
            + Add Expense
          </Link>
        </div>
      </div>

      {/* AI Search */}
      <form onSubmit={handleSearch} className="mt-4">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} style={{ color: "var(--text-muted)" }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder='AI search — try "coffee last week" or "dining over $50"'
            className="w-full rounded-lg border py-2.5 pl-9 pr-20 text-sm"
          />
          <div className="absolute right-2 top-1/2 flex -translate-y-1/2 gap-1">
            {searchMode && (
              <button
                type="button"
                onClick={clearSearch}
                className="rounded px-2 py-1 text-xs font-medium"
                style={{ color: "var(--text-muted)" }}
              >
                Clear
              </button>
            )}
            <button
              type="submit"
              disabled={searching}
              className="rounded-md px-3 py-1 text-xs font-medium text-white disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, var(--accent-purple), var(--accent-pink))" }}
            >
              {searching ? "..." : "Search"}
            </button>
          </div>
        </div>
      </form>

      {/* Search filter chips */}
      {searchMode && Object.keys(searchFilters).length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>AI understood:</span>
          {Object.entries(searchFilters).map(([key, value]) => (
            <span
              key={key}
              className="rounded-full px-2.5 py-0.5 text-xs font-medium"
              style={{ backgroundColor: "rgba(124, 92, 252, 0.15)", color: "var(--accent-purple)" }}
            >
              {FILTER_LABELS[key] || key}: {key === "category" ? CATEGORY_LABELS[String(value)] || value : String(value)}
            </span>
          ))}
        </div>
      )}

      {/* Filters */}
      {!searchMode && (
        <div className="mt-3 flex flex-wrap gap-3">
          <input
            type="month"
            value={month}
            onChange={(e) => { setMonth(e.target.value); setPage(1); }}
            className={inputClass}
          />
          <select
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(1); }}
            className={inputClass}
          >
            <option value="">All Categories</option>
            {EXPENSE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>
            ))}
          </select>
        </div>
      )}

      {/* Expense List */}
      <div className="mt-6 space-y-2">
        {loading ? (
          <ExpenseListSkeleton />
        ) : expenses.length === 0 ? (
          <div className="rounded-2xl p-8 text-center" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
            <p style={{ color: "var(--text-muted)" }}>No expenses found for this period.</p>
          </div>
        ) : (
          expenses.map((expense) => (
            <div
              key={expense.id}
              className="rounded-xl p-4 transition-colors"
              style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-color)" }}
            >
              {editingId === expense.id ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <input
                      value={editForm.merchant || ""}
                      onChange={(e) => setEditForm({ ...editForm, merchant: e.target.value })}
                      placeholder="Merchant"
                      className={inputClass}
                    />
                    <input
                      type="number"
                      step="0.01"
                      value={editForm.amount || ""}
                      onChange={(e) => setEditForm({ ...editForm, amount: parseFloat(e.target.value) })}
                      placeholder="Amount"
                      className={inputClass}
                    />
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={editForm.quantity ?? ""}
                      onChange={(e) => setEditForm({ ...editForm, quantity: e.target.value === "" ? undefined : parseInt(e.target.value) })}
                      placeholder="Qty"
                      className={inputClass}
                    />
                    <select
                      value={editForm.currency || "SGD"}
                      onChange={(e) => setEditForm({ ...editForm, currency: e.target.value })}
                      className={inputClass}
                    >
                      {CURRENCIES.map((c) => (
                        <option key={c.code} value={c.code}>{c.code}</option>
                      ))}
                    </select>
                    <input
                      type="date"
                      value={editForm.date || ""}
                      onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                      className={inputClass}
                    />
                    <select
                      value={editForm.category || ""}
                      onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                      className={inputClass}
                    >
                      {EXPENSE_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => saveEdit(expense.id)}
                      className="rounded-lg px-3 py-1.5 text-sm font-medium text-white"
                      style={{ background: "linear-gradient(135deg, var(--accent-purple), var(--accent-pink))" }}
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="rounded-lg border px-3 py-1.5 text-sm"
                      style={{ borderColor: "var(--border-color)", color: "var(--text-secondary)" }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: CATEGORY_DOT_COLORS[expense.category] || CATEGORY_DOT_COLORS.OTHER }}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium" style={{ color: "var(--text-primary)" }} title={expense.merchant}>
                        {expense.merchant}
                      </p>
                      <p className="truncate text-xs" style={{ color: "var(--text-muted)" }}>
                        {new Date(expense.date).toLocaleDateString()}
                        {expense.quantity > 1 && ` \u00D7 ${expense.quantity}`}
                        {expense.description && ` \u2014 ${expense.description}`}
                        <span className="ml-2">{CATEGORY_LABELS[expense.category]}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                      {getCurrencySymbol(expense.currency)}{(expense.amount * expense.quantity).toFixed(2)}
                    </span>
                    <button
                      onClick={() => startEdit(expense)}
                      className="text-xs font-medium hover:underline"
                      style={{ color: "var(--accent-purple)" }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(expense.id)}
                      className="text-xs font-medium hover:underline"
                      style={{ color: "var(--accent-red)" }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40"
            style={{ borderColor: "var(--border-color)", color: "var(--text-secondary)" }}
          >
            Previous
          </button>
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>
            Page {page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            disabled={page === pagination.totalPages}
            className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40"
            style={{ borderColor: "var(--border-color)", color: "var(--text-secondary)" }}
          >
            Next
          </button>
        </div>
      )}

      <ScanModal open={scanOpen} onClose={() => setScanOpen(false)} onSaved={fetchExpenses} />
    </div>
  );
}
