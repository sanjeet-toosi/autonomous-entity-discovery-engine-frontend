"use client";
import Link from "next/link";
import type { SourceCursor } from "@/lib/api";
import { fmtNum } from "@/lib/utils";
import { Badge, Empty } from "@/components/ui/primitives";

const LABEL: Record<string, string> = { web_search: "Web search", osm_overpass: "OpenStreetMap", google_places: "Google Places", nppes: "NPPES registry" };

export function SourceProgress({ sources }: { sources: Record<string, SourceCursor> }) {
  const keys = Object.keys(sources);
  if (keys.length === 0) return <Empty>No source has run yet. Enable sources under <Link className="underline" href="/integrations">Sources</Link>.</Empty>;
  return (
    <div className="space-y-2">
      {keys.map((k) => {
        const s = sources[k];
        const pending = (s.extra?.length ?? 0) > 0;
        return (
          <div key={k} className="rounded-md border border-line bg-bg/60 px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-sm font-medium">{LABEL[k] ?? k}</span>
              <Badge tone={s.done ? (s.stopped_reason ? "red" : "neutral") : "green"}>{s.done ? (s.stopped_reason ? "stopped" : "exhausted") : "active"}</Badge>
            </div>
            <div className="mt-1 grid grid-cols-3 gap-x-3 text-xs text-muted">
              <span><span className="tabular text-fg">{fmtNum(s.queries)}</span> queries</span>
              <span><span className="tabular text-fg">{fmtNum(s.hits)}</span> results</span>
              <span><span className="tabular text-accent">{fmtNum(s.added)}</span> new</span>
            </div>
            {(s.stopped_reason || pending || (s.errors ?? 0) > 0 || s.requests) && (
              <div className="mt-1 text-[11px] text-dim">
                {s.stopped_reason ?? ""}{pending ? `${s.extra!.length} follow-up jobs queued` : ""}{(s.errors ?? 0) > 0 ? ` · ${s.errors} consecutive errors` : ""}{s.requests ? ` · ${s.requests} API requests` : ""}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
