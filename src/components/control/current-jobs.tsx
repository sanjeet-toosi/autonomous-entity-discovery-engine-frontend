"use client";
import { timeAgo, cn } from "@/lib/utils";
import type { RunSnapshot } from "@/lib/api";
import { Empty } from "@/components/ui/primitives";

const STAGE_LABEL: Record<string, string> = { crawl: "Crawling", classification: "Classification", entity_resolution: "Entity Resolution", graph_update: "Graph Update", discovery: "Discovery" };
const STAGE_TONE: Record<string, string> = { crawl: "text-muted", classification: "text-violet", entity_resolution: "text-blue", graph_update: "text-accent", discovery: "text-blue" };

export function CurrentJobs({ snapshot, stages }: { snapshot: RunSnapshot | null; stages: Record<string, { stage: string; worker_id: string; at: string }> }) {
  const rows = (snapshot?.processing ?? []).map((p) => ({ ...p, stage: stages[p.domain]?.stage ?? "crawl", at: stages[p.domain]?.at ?? p.claimed_at }));
  const top = rows[0];
  return (
    <div>
      {top ? (
        <div className="mb-3 rounded-md border border-line bg-bg/60 p-4">
          <div className="mono text-[10.5px] uppercase tracking-[0.14em] text-muted">Currently processing</div>
          <div className="mt-1 truncate text-xl font-medium">{top.domain}</div>
          <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-4">
            <Cell k="Stage" v={<span className={STAGE_TONE[top.stage]}>{STAGE_LABEL[top.stage] ?? top.stage}</span>} />
            <Cell k="Worker" v={<span className="mono text-xs">{top.worker ?? "—"}</span>} />
            <Cell k="Source" v={<span className="mono text-xs">{top.source}</span>} />
            <Cell k="Started" v={timeAgo(top.at)} />
          </div>
        </div>
      ) : (
        <Empty>No domains in flight.</Empty>
      )}
      {rows.length > 1 && (
        <div className="divide-y divide-line/60 rounded-md border border-line">
          {rows.slice(1, 12).map((r) => (
            <div key={r.domain} className="flex items-center gap-3 px-3 py-1.5 text-sm">
              <span className="min-w-0 flex-1 truncate">{r.domain}</span>
              <span className={cn("mono w-36 text-[11px] uppercase tracking-wider", STAGE_TONE[r.stage])}>{STAGE_LABEL[r.stage] ?? r.stage}</span>
              <span className="mono w-40 truncate text-[11px] text-dim">{r.worker}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Cell({ k, v }: { k: string; v: React.ReactNode }) {
  return <div><div className="mono text-[10px] uppercase tracking-wider text-dim">{k}</div><div className="mt-0.5">{v}</div></div>;
}
