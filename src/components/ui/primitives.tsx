"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

export function Panel({ className, title, action, children, padded = true }: { className?: string; title?: React.ReactNode; action?: React.ReactNode; children: React.ReactNode; padded?: boolean }) {
  return (
    <section className={cn("min-w-0 max-w-full rounded-lg border border-line bg-panel/80 backdrop-blur-sm", className)}>
      {(title || action) && (
        <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5">
          <h3 className="mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted">{title}</h3>
          {action}
        </header>
      )}
      <div className={cn(padded && "p-4")}>{children}</div>
    </section>
  );
}

const button = cva(
  "inline-flex items-center justify-center gap-2 rounded-md border text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "border-accent/60 bg-accent text-black hover:bg-accent/90",
        secondary: "border-line-strong bg-elev text-fg hover:bg-panel hover:border-line-strong",
        ghost: "border-transparent bg-transparent text-muted hover:text-fg hover:bg-elev",
        danger: "border-red/40 bg-red-dim text-red hover:bg-red/25",
        warn: "border-amber/40 bg-amber-dim text-amber hover:bg-amber/25",
      },
      size: { sm: "h-7 px-2.5 text-xs", md: "h-9 px-4", lg: "h-11 px-6 text-base" },
    },
    defaultVariants: { variant: "secondary", size: "md" },
  },
);
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof button> {}
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, ...props }, ref) => (
  <button ref={ref} className={cn(button({ variant, size }), className)} {...props} />
));
Button.displayName = "Button";

const badge = cva("inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 mono text-[10.5px] font-medium uppercase tracking-wider", {
  variants: {
    tone: {
      neutral: "border-line-strong bg-elev text-muted",
      green: "border-accent/30 bg-accent-dim text-accent",
      amber: "border-amber/30 bg-amber-dim text-amber",
      red: "border-red/30 bg-red-dim text-red",
      blue: "border-blue/30 bg-blue-dim text-blue",
      violet: "border-violet/30 bg-violet-dim text-violet",
    },
  },
  defaultVariants: { tone: "neutral" },
});
export function Badge({ className, tone, children }: { className?: string; tone?: VariantProps<typeof badge>["tone"]; children: React.ReactNode }) {
  return <span className={cn(badge({ tone }), className)}>{children}</span>;
}

export function StatusDot({ status, className }: { status: string; className?: string }) {
  const map: Record<string, string> = {
    RUNNING: "bg-accent", STARTING: "bg-accent", RESUMING: "bg-accent", PAUSED: "bg-amber", PAUSING: "bg-amber", STOPPING: "bg-red",
    STOPPED: "bg-dim", COMPLETED: "bg-blue", FAILED: "bg-red", HEALTHY: "bg-accent", UNHEALTHY: "bg-red", DRAFT: "bg-dim",
  };
  const pulse = ["RUNNING", "STARTING", "RESUMING", "PAUSING", "STOPPING"].includes(status);
  return <span className={cn("inline-block h-2 w-2 rounded-full", map[status] ?? "bg-dim", pulse && "pulse", className)} />;
}

export function statusTone(status: string): VariantProps<typeof badge>["tone"] {
  if (["RUNNING", "STARTING", "RESUMING", "HEALTHY", "ACTIVE", "VALIDATED", "PROCESSED"].includes(status)) return "green";
  if (["PAUSED", "PAUSING", "TESTING", "PROPOSED", "RETRY", "PROCESSING", "DRAFT"].includes(status)) return "amber";
  if (["FAILED", "STOPPING", "UNHEALTHY", "REJECTED"].includes(status)) return "red";
  if (["COMPLETED", "QUEUED", "NEW"].includes(status)) return "blue";
  return "neutral";
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn("h-9 w-full rounded-md border border-line-strong bg-elev px-3 text-sm text-fg placeholder:text-dim focus:border-accent/60 focus:outline-none", props.className)} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn("h-9 rounded-md border border-line-strong bg-elev px-2 text-sm text-fg focus:border-accent/60 focus:outline-none", props.className)} />;
}

export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: { id: T; label: string; count?: number }[]; value: T; onChange: (t: T) => void }) {
  return (
    <div className="flex flex-wrap gap-1 border-b border-line">
      {tabs.map((t) => (
        <button key={t.id} onClick={() => onChange(t.id)} className={cn("-mb-px border-b-2 px-3 py-2 text-sm transition-colors", value === t.id ? "border-accent text-fg" : "border-transparent text-muted hover:text-fg")}>
          {t.label}
          {t.count !== undefined && <span className="ml-1.5 mono text-[10px] text-dim">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="py-10 text-center text-sm text-dim">{children}</div>;
}

export function Kv({ k, v, mono = false }: { k: string; v: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line/60 py-1.5 last:border-0">
      <span className="text-xs text-muted">{k}</span>
      <span className={cn("text-sm text-fg text-right", mono && "mono text-xs")}>{v}</span>
    </div>
  );
}

export function Table({ head, children, className }: { head: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("max-w-full overflow-x-auto", className)}>
      <table className="w-full text-sm">
        <thead className="mono text-[10.5px] uppercase tracking-wider text-dim">
          <tr className="border-b border-line [&>th]:px-3 [&>th]:py-2 [&>th]:text-left [&>th]:font-medium">{head}</tr>
        </thead>
        <tbody className="[&>tr]:border-b [&>tr]:border-line/60 [&>tr:last-child]:border-0 [&>tr>td]:px-3 [&>tr>td]:py-2 [&>tr:hover]:bg-elev/60">{children}</tbody>
      </table>
    </div>
  );
}

export function Progress({ value, tone = "accent" }: { value: number; tone?: "accent" | "amber" | "red" | "blue" }) {
  const color = { accent: "bg-accent", amber: "bg-amber", red: "bg-red", blue: "bg-blue" }[tone];
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-elev">
      <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${Math.max(0, Math.min(100, value * 100))}%` }} />
    </div>
  );
}

export function Confidence({ value }: { value: number }) {
  const tone = value >= 0.8 ? "accent" : value >= 0.5 ? "amber" : "red";
  return (
    <div className="flex items-center gap-2">
      <div className="w-14"><Progress value={value} tone={tone} /></div>
      <span className="mono tabular text-xs text-muted">{Math.round(value * 100)}%</span>
    </div>
  );
}
