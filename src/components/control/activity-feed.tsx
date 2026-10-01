"use client";
import { useMemo, useState } from "react";
import { cn, fmtTime } from "@/lib/utils";
import type { ActivityEvent } from "@/lib/api";
import { Empty } from "@/components/ui/primitives";

const FILTERS = [
  { id: "all", label: "All" }, { id: "discovery", label: "Discovery" }, { id: "crawl", label: "Crawler" }, { id: "ai", label: "AI" },
  { id: "graph", label: "Graph" }, { id: "brain", label: "Brain" }, { id: "errors", label: "Errors" }, { id: "workers", label: "Workers" }, { id: "system", label: "System" },
];
const CAT_COLOR: Record<string, string> = { discovery: "text-blue", crawl: "text-muted", ai: "text-violet", graph: "text-accent", brain: "text-amber", errors: "text-red", workers: "text-dim", system: "text-fg" };

export function ActivityFeed({ events, height = "h-[520px]", showFilters = true, raw = false }: { events: ActivityEvent[]; height?: string; showFilters?: boolean; raw?: boolean }) {
  const [filter, setFilter] = useState("all");
  const [showRaw, setShowRaw] = useState(raw);
  const list = useMemo(() => (filter === "all" ? events : events.filter((e) => e.category === filter)), [events, filter]);
  return (
    <div className="flex h-full flex-col">
      {showFilters && (
        <div className="flex flex-wrap items-center gap-1 border-b border-line px-3 py-2">
          {FILTERS.map((f) => (
            <button key={f.id} onClick={() => setFilter(f.id)} className={cn("rounded-full px-2.5 py-1 mono text-[10.5px] uppercase tracking-wider transition-colors", filter === f.id ? "bg-panel text-fg ring-1 ring-line-strong" : "text-dim hover:text-fg")}>{f.label}</button>
          ))}
          <button onClick={() => setShowRaw((x) => !x)} className={cn("ml-auto rounded-full px-2.5 py-1 mono text-[10.5px] uppercase tracking-wider", showRaw ? "bg-panel text-fg ring-1 ring-line-strong" : "text-dim hover:text-fg")}>raw</button>
        </div>
      )}
      <div className={cn("min-h-0 flex-1 overflow-y-auto font-mono text-[12.5px] leading-6", height)}>
        {list.length === 0 && <Empty>No events yet — start a mission to see the agent work.</Empty>}
        {list.map((e, i) => (
          <div key={e.id ?? `${e.timestamp}-${i}`} className={cn("feed-in flex min-w-0 gap-3 border-b border-line/40 px-3 py-1 hover:bg-elev/60", e.level === "error" && "bg-red-dim/40", e.level === "warning" && "bg-amber-dim/30")}>
            <span className="shrink-0 tabular text-dim">{fmtTime(e.timestamp)}</span>
            <span className={cn("w-[74px] shrink-0 truncate text-[10.5px] uppercase tracking-wider", CAT_COLOR[e.category] ?? "text-dim")}>{e.category}</span>
            {showRaw ? (
              <span className="min-w-0 break-all text-muted">{e.event} {e.domain ? `[${e.domain}] ` : ""}{JSON.stringify(e.payload)}</span>
            ) : (
              <span className="min-w-0 truncate text-fg/90">{e.message}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
