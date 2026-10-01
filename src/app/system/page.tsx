"use client";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { fmtNum, timeAgo, fmtTime } from "@/lib/utils";
import { PageHeader } from "@/components/layout/shell";
import { Badge, Empty, Panel, StatusDot, Table, statusTone } from "@/components/ui/primitives";

export default function SystemPage() {
  const health = useQuery({ queryKey: ["health"], queryFn: api.health, refetchInterval: 5000 });
  const workers = useQuery({ queryKey: ["workers"], queryFn: api.workers, refetchInterval: 5000 });
  const queues = useQuery({ queryKey: ["queues"], queryFn: api.queues, refetchInterval: 5000 });
  const errors = useQuery({ queryKey: ["system-errors"], queryFn: api.systemErrors, refetchInterval: 10000 });
  const config = useQuery({ queryKey: ["config"], queryFn: api.systemConfig });
  const h = health.data;
  return (
    <div className="flex h-full min-h-0 flex-col">
      <PageHeader title="System" subtitle="Infrastructure health, worker fleet, queue depth and crawl governance." />
      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto space-y-4 p-6">
        <div className="grid [&>*]:min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Svc name="API" ok={!!h} detail={h ? h.environment : health.isError ? "unreachable" : "…"} />
          <Svc name="PostgreSQL" ok={!!h?.postgres} detail="system of record" />
          <Svc name="Redis" ok={!!h?.redis} detail="control flags · rate limits · events" />
          <Svc name="Neo4j" ok={!!h?.neo4j} detail={h?.neo4j_enabled ? "graph projection" : "disabled"} />
          <Svc name="Model" ok={!!h?.llm} detail={h ? `${h.llm.provider} · ${h.llm.model}${h.llm.ollama_healthy === false ? " (unreachable)" : ""}` : "…"} />
        </div>
        <div className="grid [&>*]:min-w-0 gap-4 lg:grid-cols-[1fr_360px]">
          <Panel title="Workers" padded={false}>
            {workers.data?.workers.length === 0 ? <Empty>No workers registered. Run <span className="mono">python -m app.workers.run all</span>.</Empty> : (
              <Table head={<><th>Worker</th><th>Type</th><th>Status</th><th>Current</th><th>Completed</th><th>Failed</th><th>Heartbeat</th></>}>
                {(workers.data?.workers ?? []).map((w) => (
                  <tr key={w.worker_id}><td className="mono text-xs">{w.worker_id}</td><td><Badge>{w.worker_type}</Badge></td><td><Badge tone={statusTone(w.status)}><StatusDot status={w.status} /> {w.status}</Badge></td>
                    <td className="max-w-[320px] truncate mono text-[11px] text-muted">{w.current_job ? summarizeJob(w.current_job) : "idle"}</td><td className="tabular">{fmtNum(w.jobs_completed)}</td><td className="tabular text-red">{fmtNum(w.jobs_failed)}</td><td className="text-dim">{timeAgo(w.last_heartbeat)}</td></tr>
                ))}
              </Table>
            )}
          </Panel>
          <div className="space-y-4">
            <Panel title="Frontier queues">
              {queues.data && Object.keys(queues.data.frontier_by_mission).length === 0 && <div className="text-sm text-dim">Empty</div>}
              {queues.data && Object.entries(queues.data.frontier_by_mission).map(([mid, counts]: any) => (
                <div key={mid} className="mb-3 text-sm"><div className="mono text-[10px] text-dim">mission {mid.slice(0, 8)}</div>
                  <div className="mt-1 grid grid-cols-2 gap-x-4">{Object.entries(counts).map(([k, v]: any) => <div key={k} className="flex justify-between"><span className="text-muted">{k}</span><span className="tabular">{fmtNum(v)}</span></div>)}</div></div>
              ))}
            </Panel>
            <Panel title="Crawl governance">
              {config.data && <div className="space-y-1 text-sm">
                <Row k="Per-domain rate" v={`${config.data.crawl.per_domain_rpm} req/min`} /><Row k="Global concurrency" v={config.data.crawl.global_concurrency} /><Row k="Max pages / domain" v={config.data.crawl.max_pages_per_domain} />
                <Row k="robots.txt" v={config.data.crawl.respect_robots ? "respected" : "ignored"} /><Row k="Lease" v={`${config.data.workers.lease_seconds}s · ${config.data.workers.max_attempts} attempts`} /><Row k="LLM rate" v={`${config.data.llm.max_calls_per_minute}/min`} />
                <div className="pt-1 text-[11px] text-dim">{config.data.crawl.blocked_domains.length} blocked domains · private networks blocked (SSRF guard)</div></div>}
            </Panel>
          </div>
        </div>
        <Panel title="Recent errors" padded={false}>
          {errors.data?.length === 0 ? <Empty>No errors.</Empty> : (
            <Table head={<><th>Time</th><th>Event</th><th>Domain</th><th>Message</th><th>Worker</th></>}>
              {(errors.data ?? []).map((e: any) => <tr key={e.id}><td className="mono text-xs text-dim">{fmtTime(e.timestamp)}</td><td><Badge tone={e.level === "error" ? "red" : "amber"}>{e.event}</Badge></td><td className="mono text-xs">{e.domain}</td><td className="max-w-[480px] truncate text-muted">{e.message}</td><td className="mono text-xs text-dim">{e.worker_id}</td></tr>)}
            </Table>
          )}
        </Panel>
      </div>
    </div>
  );
}

function Svc({ name, ok, detail }: { name: string; ok: boolean; detail: string }) {
  return <div className="rounded-lg border border-line bg-panel/80 p-4"><div className="flex items-center gap-2"><StatusDot status={ok ? "HEALTHY" : "UNHEALTHY"} /><span className="font-medium">{name}</span></div><div className="mt-1 truncate text-xs text-muted">{detail}</div></div>;
}
function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return <div className="flex justify-between"><span className="text-muted">{k}</span><span className="tabular">{v}</span></div>;
}
function summarizeJob(j: Record<string, any>): string {
  if (j.jobs) return `${j.active} active: ${j.jobs.map((x: any) => x.domain).join(", ")}`;
  if (j.query) return `${j.source ?? "search"}: ${j.query} (${j.index}/${j.of})`;
  if (j.stage) return j.stage;
  return JSON.stringify(j);
}
