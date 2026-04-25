"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const CATEGORY_LABELS: Record<string, string> = {
  GROCERIES: "Groceries",
  DINING: "Dining",
  TRANSPORTATION: "Transport",
  ENTERTAINMENT: "Entertain",
  UTILITIES: "Utilities",
  HEALTHCARE: "Health",
  SHOPPING: "Shopping",
  TRAVEL: "Travel",
  OTHER: "Other",
};

const COLORS: Record<string, string> = {
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

interface CategoryData {
  category: string;
  total: number;
  count: number;
}

export default function CategoryChart({ data }: { data: CategoryData[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center" style={{ color: "var(--text-muted)" }}>
        No spending data for this month
      </div>
    );
  }

  const chartData = data
    .map((d) => ({
      name: CATEGORY_LABELS[d.category] || d.category,
      amount: Math.round(d.total * 100) / 100,
      category: d.category,
    }))
    .sort((a, b) => b.amount - a.amount);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2d3348" />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 12, fill: "#6b7194" }}
          axisLine={{ stroke: "#2d3348" }}
          tickLine={{ stroke: "#2d3348" }}
        />
        <YAxis
          tick={{ fontSize: 12, fill: "#6b7194" }}
          axisLine={{ stroke: "#2d3348" }}
          tickLine={{ stroke: "#2d3348" }}
          tickFormatter={(v) => `$${v}`}
        />
        <Tooltip
          formatter={(value) => [`$${Number(value).toFixed(2)}`, "Spent"]}
          contentStyle={{
            borderRadius: "12px",
            border: "1px solid #2d3348",
            backgroundColor: "#1a1d2e",
            color: "#f0f0f5",
            boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
          }}
          labelStyle={{ color: "#9ca3bf" }}
          cursor={{ fill: "rgba(124, 92, 252, 0.08)" }}
        />
        <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
          {chartData.map((entry) => (
            <Cell
              key={entry.category}
              fill={COLORS[entry.category] || COLORS.OTHER}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
