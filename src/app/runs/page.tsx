"use client";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { api } from "@/lib/api";
import { fmtDate, fmtDuration, fmtNum, timeAgo } from "@/lib/utils";
import { PageHeader } from "@/components/layout/shell";
import { Badge, Empty, StatusDot, Table, statusTone } from "@/components/ui/primitives";

export default function RunsPage() {
  const q = useQuery({ queryKey: ["runs"], queryFn: () => api.runs({ limit: 100 }), refetchInterval: 8000 });
  return (
    <div className="flex h-full min-h-0 flex-col">
      <PageHeader title="Runs" subtitle="Every execution period of a mission, with its checkpoint lineage." />
      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto p-6">
        {q.data?.length === 0 && <Empty>No runs yet.</Empty>}
        {q.data && q.data.length > 0 && (
          <div className="rounded-lg border border-line bg-panel/80">
            <Table head={<><th>Mission</th><th>Status</th><th>Started</th><th>Runtime</th><th>Businesses</th><th>Crawled</th><th>Frontier</th><th>Errors</th><th>Strategy</th></>}>
              {q.data.map((r) => (
                <tr key={r.id}>
                  <td><Link href={`/runs/${r.id}`} className="font-medium hover:underline">{r.mission_prompt}</Link><div className="mono text-[10px] text-dim">{r.id.slice(0, 8)}{r.parent_run_id && ` ← ${r.parent_run_id.slice(0, 8)}`}</div></td>
                  <td><Badge tone={statusTone(r.status)}><StatusDot status={r.status} /> {r.status}</Badge></td>
                  <td className="text-muted" title={r.started_at ?? ""}>{r.started_at ? `${fmtDate(r.started_at)} · ${timeAgo(r.started_at)}` : "—"}</td>
                  <td className="mono tabular text-xs">{fmtDuration(r.runtime_seconds)}</td>
                  <td className="tabular">{fmtNum(r.stats?.businesses)}</td><td className="tabular">{fmtNum(r.stats?.domains_crawled)}</td>
                  <td className="tabular">{fmtNum(r.stats?.queued)} <span className="text-dim">/ {fmtNum(r.stats?.candidates)}</span></td>
                  <td className="tabular text-red">{fmtNum(r.stats?.errors)}</td><td className="mono text-xs text-dim">{r.strategy_version}</td>
                </tr>
              ))}
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
