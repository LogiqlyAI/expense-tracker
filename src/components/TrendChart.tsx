"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface TrendData {
  month: string;
  label: string;
  total: number;
  categories: Record<string, number>;
}

export default function TrendChart({ data }: { data: TrendData[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center" style={{ color: "var(--text-muted)" }}>
        No trend data available
      </div>
    );
  }

  const chartData = data.map((d) => ({
    name: d.label,
    total: Math.round(d.total * 100) / 100,
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <defs>
          <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7c5cfc" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#7c5cfc" stopOpacity={0} />
          </linearGradient>
        </defs>
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
          formatter={(value) => [`$${Number(value).toFixed(2)}`, "Total"]}
          contentStyle={{
            borderRadius: "12px",
            border: "1px solid #2d3348",
            backgroundColor: "#1a1d2e",
            color: "#f0f0f5",
            boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
          }}
          labelStyle={{ color: "#9ca3bf" }}
        />
        <Area
          type="monotone"
          dataKey="total"
          stroke="#7c5cfc"
          strokeWidth={2}
          fill="url(#trendGradient)"
          dot={{ r: 4, fill: "#7c5cfc", stroke: "#1e2235", strokeWidth: 2 }}
          activeDot={{ r: 6, fill: "#e84393", stroke: "#1e2235", strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
