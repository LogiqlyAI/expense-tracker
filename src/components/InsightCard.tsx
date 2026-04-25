"use client";

interface InsightCardProps {
  type: "trend" | "alert" | "tip";
  text: string;
  variant?: "positive" | "negative" | "neutral" | "warning" | "critical";
}

const ICONS: Record<string, string> = {
  trend: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6",
  alert: "M12 9v2m0 4h.01M12 2l10 18H2L12 2z",
  tip: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z",
};

const COLORS: Record<string, { border: string; icon: string; bg: string }> = {
  positive: { border: "var(--accent-green)", icon: "var(--accent-green)", bg: "rgba(0, 184, 148, 0.08)" },
  negative: { border: "var(--accent-red)", icon: "var(--accent-red)", bg: "rgba(255, 107, 107, 0.08)" },
  neutral: { border: "var(--accent-purple)", icon: "var(--accent-purple)", bg: "rgba(124, 92, 252, 0.08)" },
  warning: { border: "var(--accent-yellow)", icon: "var(--accent-yellow)", bg: "rgba(253, 203, 110, 0.08)" },
  critical: { border: "var(--accent-red)", icon: "var(--accent-red)", bg: "rgba(255, 107, 107, 0.08)" },
  tip: { border: "var(--accent-teal)", icon: "var(--accent-teal)", bg: "rgba(0, 206, 201, 0.08)" },
};

export default function InsightCard({ type, text, variant }: InsightCardProps) {
  const colorKey = type === "tip" ? "tip" : variant || "neutral";
  const colors = COLORS[colorKey] || COLORS.neutral;
  const iconPath = ICONS[type];

  return (
    <div
      className="rounded-xl p-4"
      style={{ backgroundColor: colors.bg, borderLeft: `3px solid ${colors.border}` }}
    >
      <div className="flex gap-3">
        <svg className="mt-0.5 h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} style={{ color: colors.icon }}>
          <path strokeLinecap="round" strokeLinejoin="round" d={iconPath} />
        </svg>
        <p className="text-sm" style={{ color: "var(--text-primary)" }}>{text}</p>
      </div>
    </div>
  );
}
