"use client";

import { useState } from "react";
import InsightCard from "@/components/InsightCard";

interface InsightData {
  summary: string;
  trends: { text: string; type: "positive" | "negative" | "neutral" }[];
  alerts: { text: string; severity: "warning" | "critical" }[];
  tips: string[];
}

export default function InsightsPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [insights, setInsights] = useState<InsightData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [generated, setGenerated] = useState(false);

  const monthLabel = new Date(year, month - 1).toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  function prevMonth() {
    if (month === 1) { setYear(year - 1); setMonth(12); }
    else { setMonth(month - 1); }
    setGenerated(false);
    setInsights(null);
  }

  function nextMonth() {
    if (month === 12) { setYear(year + 1); setMonth(1); }
    else { setMonth(month + 1); }
    setGenerated(false);
    setInsights(null);
  }

  async function handleGenerate() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year, month }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to generate insights");
        setLoading(false);
        return;
      }

      setInsights(data.insights);
      setGenerated(true);
    } catch {
      setError("Something went wrong. Please try again.");
    }

    setLoading(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>AI Insights</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            Get AI-powered analysis of your spending patterns.
          </p>
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

      {error && (
        <div className="mt-4 rounded-lg p-3 text-sm" style={{ backgroundColor: "rgba(255, 107, 107, 0.1)", color: "var(--accent-red)" }}>
          {error}
        </div>
      )}

      <div className="mt-6 max-w-2xl">
        {!generated && !loading && (
          <div className="rounded-2xl p-10 text-center" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl" style={{ background: "linear-gradient(135deg, var(--accent-purple), var(--accent-pink))", opacity: 0.8 }}>
              <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
              Ready to analyze {monthLabel}
            </h3>
            <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
              AI will review your spending patterns, compare with last month, and provide personalized recommendations.
            </p>
            <button
              onClick={handleGenerate}
              className="mt-5 rounded-lg px-6 py-2.5 text-sm font-semibold text-white"
              style={{ background: "linear-gradient(135deg, var(--accent-purple), var(--accent-pink))" }}
            >
              Generate Insights
            </button>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center rounded-2xl p-12" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
            <div className="h-10 w-10 animate-spin rounded-full border-4" style={{ borderColor: "var(--border-color)", borderTopColor: "var(--accent-purple)" }} />
            <p className="mt-4 font-medium" style={{ color: "var(--text-primary)" }}>Analyzing your spending...</p>
            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>This may take a few seconds</p>
          </div>
        )}

        {insights && !loading && (
          <div className="space-y-5">
            {/* Summary */}
            <div
              className="rounded-2xl p-6"
              style={{
                background: "linear-gradient(135deg, rgba(124, 92, 252, 0.12), rgba(232, 67, 147, 0.08))",
                border: "1px solid rgba(124, 92, 252, 0.25)",
              }}
            >
              <div className="flex items-start gap-3">
                <svg className="mt-0.5 h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} style={{ color: "var(--accent-purple)" }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>
                  {insights.summary}
                </p>
              </div>
            </div>

            {/* Alerts */}
            {insights.alerts.length > 0 && (
              <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--accent-red)" }}>
                  Alerts
                </h3>
                <div className="space-y-2">
                  {insights.alerts.map((alert, i) => (
                    <InsightCard key={i} type="alert" text={alert.text} variant={alert.severity} />
                  ))}
                </div>
              </div>
            )}

            {/* Trends */}
            {insights.trends.length > 0 && (
              <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--accent-purple)" }}>
                  Trends
                </h3>
                <div className="space-y-2">
                  {insights.trends.map((trend, i) => (
                    <InsightCard key={i} type="trend" text={trend.text} variant={trend.type} />
                  ))}
                </div>
              </div>
            )}

            {/* Tips */}
            {insights.tips.length > 0 && (
              <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--accent-teal)" }}>
                  Tips
                </h3>
                <div className="space-y-2">
                  {insights.tips.map((tip, i) => (
                    <InsightCard key={i} type="tip" text={tip} />
                  ))}
                </div>
              </div>
            )}

            {/* Regenerate */}
            <div className="text-center">
              <button
                onClick={handleGenerate}
                className="rounded-lg border px-4 py-2 text-sm font-medium transition-colors"
                style={{ borderColor: "var(--border-color)", color: "var(--text-secondary)" }}
              >
                Regenerate Insights
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
