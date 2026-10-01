"use client";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Progress } from "@/components/ui/primitives";

const LABELS: Record<string, string> = { crawler: "Crawler Workers", discovery: "Discovery Workers", reflection: "Reflection Workers", browser: "Browser Workers", intelligence: "AI Workers", graph: "Graph Workers" };

export function WorkerStatus() {
  const q = useQuery({ queryKey: ["workers"], queryFn: api.workers, refetchInterval: 5000 });
  const summary = q.data?.summary ?? {};
  const types = ["crawler", "discovery", "reflection", "browser"];
  return (
    <div className="space-y-3">
      {types.map((t) => {
        const s = summary[t] ?? { healthy: 0, total: 0 };
        return (
          <div key={t}>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">{LABELS[t]}</span>
              <span className="mono tabular text-xs">{s.healthy} / {s.total}</span>
            </div>
            <div className="mt-1"><Progress value={s.total ? s.healthy / s.total : 0} tone={s.total === 0 ? "amber" : s.healthy === s.total ? "accent" : "red"} /></div>
          </div>
        );
      })}
      {q.data && q.data.workers.length === 0 && <div className="text-xs text-dim">No workers connected. Start them with <span className="mono">python -m app.workers.run all</span>.</div>}
    </div>
  );
}
