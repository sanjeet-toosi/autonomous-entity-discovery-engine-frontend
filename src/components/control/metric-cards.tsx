"use client";
import { fmtNum } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function MetricCard({ label, value, change, changeLabel = "last 24h", tone = "accent", compact = true, hint }: { label: string; value: number | null | undefined; change?: number | null; changeLabel?: string; tone?: "accent" | "blue" | "violet" | "amber"; compact?: boolean; hint?: string }) {
  const color = { accent: "text-accent", blue: "text-blue", violet: "text-violet", amber: "text-amber" }[tone];
  return (
    <div className="min-w-0 rounded-lg border border-line bg-panel/80 p-4">
      <div className="mono text-[10.5px] uppercase tracking-[0.14em] text-muted">{label}</div>
      <div className={cn("mt-2 tabular text-3xl font-semibold tracking-tight", color)}>{fmtNum(value, compact)}</div>
      {change !== undefined && (
        <div className="mt-1 flex items-baseline gap-1.5 text-xs">
          <span className={cn("tabular", (change ?? 0) > 0 ? "text-fg" : "text-dim")}>{(change ?? 0) > 0 ? "+" : ""}{fmtNum(change, true)}</span>
          <span className="text-dim">{changeLabel}</span>
        </div>
      )}
      {hint && <div className="mt-1 text-[11px] text-dim">{hint}</div>}
    </div>
  );
}

export function MiniStat({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className="min-w-0 rounded-md border border-line/70 bg-elev/60 px-3 py-2">
      <div className="mono text-[10px] uppercase tracking-wider text-dim">{label}</div>
      <div className="mt-0.5 truncate tabular text-base font-medium">{value}</div>
      {sub && <div className="text-[11px] text-dim">{sub}</div>}
    </div>
  );
}
