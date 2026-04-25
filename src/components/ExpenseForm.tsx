"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { EXPENSE_CATEGORIES } from "@/lib/validations";
import { CURRENCIES } from "@/lib/currencies";

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

interface ExpenseFormProps {
  initialData?: {
    id?: string;
    merchant: string;
    amount: number;
    quantity?: number;
    currency?: string;
    date: string;
    category: string;
    description?: string;
  };
  mode?: "create" | "edit";
}

export default function ExpenseForm({ initialData, mode = "create" }: ExpenseFormProps) {
  const router = useRouter();
  const [merchant, setMerchant] = useState(initialData?.merchant || "");
  const [amount, setAmount] = useState(initialData?.amount?.toString() || "");
  const [quantity, setQuantity] = useState(initialData?.quantity?.toString() || "1");
  const [currency, setCurrency] = useState(initialData?.currency || "SGD");
  const [date, setDate] = useState(
    initialData?.date || new Date().toISOString().split("T")[0]
  );
  const [category, setCategory] = useState(initialData?.category || "OTHER");
  const [description, setDescription] = useState(initialData?.description || "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const currencySymbol = CURRENCIES.find((c) => c.code === currency)?.symbol || currency;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Amount must be a positive number");
      setLoading(false);
      return;
    }

    const parsedQuantity = parseInt(quantity);
    if (isNaN(parsedQuantity) || parsedQuantity < 1) {
      setError("Quantity must be at least 1");
      setLoading(false);
      return;
    }

    const url =
      mode === "edit" && initialData?.id
        ? `/api/expenses/${initialData.id}`
        : "/api/expenses";

    try {
      const res = await fetch(url, {
        method: mode === "edit" ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchant,
          amount: parsedAmount,
          quantity: parsedQuantity,
          currency,
          date,
          category,
          description: description || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        setLoading(false);
        return;
      }

      toast.success(mode === "edit" ? "Expense updated" : "Expense added");
      router.push("/expenses");
      router.refresh();
    } catch {
      toast.error("Something went wrong");
      setLoading(false);
    }
  }

  const inputClass = "mt-1 block w-full rounded-lg border px-3 py-2.5 text-sm";
  const labelClass = "block text-sm font-medium";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-lg p-3 text-sm" style={{ backgroundColor: "rgba(255, 107, 107, 0.1)", color: "var(--accent-red)" }}>
          {error}
        </div>
      )}

      <div>
        <label htmlFor="merchant" className={labelClass} style={{ color: "var(--text-secondary)" }}>
          Merchant
        </label>
        <input
          id="merchant"
          type="text"
          required
          value={merchant}
          onChange={(e) => setMerchant(e.target.value)}
          placeholder="e.g. Whole Foods"
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div>
          <label htmlFor="amount" className={labelClass} style={{ color: "var(--text-secondary)" }}>
            Amount ({currencySymbol})
          </label>
          <input
            id="amount"
            type="number"
            step="0.01"
            min="0.01"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="quantity" className={labelClass} style={{ color: "var(--text-secondary)" }}>
            Quantity
          </label>
          <input
            id="quantity"
            type="number"
            min="1"
            step="1"
            required
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="currency" className={labelClass} style={{ color: "var(--text-secondary)" }}>
            Currency
          </label>
          <select
            id="currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className={inputClass}
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} ({c.symbol})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="date" className={labelClass} style={{ color: "var(--text-secondary)" }}>
            Date
          </label>
          <input
            id="date"
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="category" className={labelClass} style={{ color: "var(--text-secondary)" }}>
          Category
        </label>
        <select
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className={inputClass}
        >
          {EXPENSE_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {CATEGORY_LABELS[cat]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="description" className={labelClass} style={{ color: "var(--text-secondary)" }}>
          Description (optional)
        </label>
        <input
          id="description"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description"
          className={inputClass}
        />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-all disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, var(--accent-purple), var(--accent-pink))" }}
        >
          {loading
            ? mode === "edit" ? "Saving..." : "Adding..."
            : mode === "edit" ? "Save Changes" : "Add Expense"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border px-5 py-2.5 text-sm font-medium"
          style={{ borderColor: "var(--border-color)", color: "var(--text-secondary)" }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
