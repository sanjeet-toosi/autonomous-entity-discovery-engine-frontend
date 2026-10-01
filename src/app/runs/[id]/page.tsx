"use client";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";
import { useLive } from "@/lib/live";
import { fmtNum, fmtPct, fmtDate, fmtTime } from "@/lib/utils";
import { PageHeader } from "@/components/layout/shell";
import { RunController } from "@/components/control/run-controller";
import { MetricCard, MiniStat } from "@/components/control/metric-cards";
import { ActivityFeed } from "@/components/control/activity-feed";
import { CurrentJobs } from "@/components/control/current-jobs";
import { Badge, Empty, Panel, Table, Tabs } from "@/components/ui/primitives";
import { Sparkline } from "@/components/control/sparkline";
import { SourceProgress } from "@/components/control/source-progress";

type Tab = "activity" | "errors" | "checkpoints" | "changes";

export default function RunDetail() {
  const { id } = useParams<{ id: string }>();
  const [tab, setTab] = useState<Tab>("activity");
  const run = useQuery({ queryKey: ["run", id], queryFn: () => api.run(id), refetchInterval: 10000 });
  const live = useLive(id);
  const history = useQuery({ queryKey: ["activity-initial", id], queryFn: () => api.activity({ run_id: id, limit: 200 }) });
  const errors = useQuery({ queryKey: ["run-errors", id], queryFn: () => api.runErrors(id), enabled: tab === "errors" });
  const cps = useQuery({ queryKey: ["run-cps", id], queryFn: () => api.runCheckpoints(id), enabled: tab === "checkpoints" });
  const changes = useQuery({ queryKey: ["run-changes", id], queryFn: () => api.changeEvents({ run_id: id, limit: 200 }), enabled: tab === "changes" });
  const series = useQuery({ queryKey: ["series", id], queryFn: () => api.series("business_created", 24, id), refetchInterval: 60000 });
  const snap = live.snapshot ?? run.data?.snapshot ?? null;
  const m = snap?.metrics;
  const events = [...live.events, ...(history.data ?? [])].slice(0, 500);
  if (!run.data) return <Empty>Loading run…</Empty>;
  return (
    <div className="flex h-full min-h-0 flex-col">
      <PageHeader title="Live run" subtitle={<span className="mono text-xs">{id}</span>} action={<span className="text-xs text-muted"><span className={live.connected ? "text-accent" : "text-dim"}>●</span> {live.connected ? "live" : "reconnecting"}</span>} />
      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto space-y-4 p-6">
        <RunController run={run.data} liveStatus={live.runStatus} runtime={snap?.runtime_seconds} />
        <div className="grid [&>*]:min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Businesses (this run)" value={snap?.totals.businesses} changeLabel="" compact={false} />
          <MetricCard label="Categories created" value={snap?.totals.categories} tone="violet" compact={false} />
          <MetricCard label="Edges created" value={snap?.totals.edges} tone="blue" compact={false} />
          <MetricCard label="Frontier" value={snap?.frontier.queued} tone="amber" compact={false} hint={snap ? `${fmtNum(snap.frontier.processing)} processing · ${fmtNum(snap.frontier.processed)} processed · ${fmtNum(snap.frontier.rejected)} rejected · ${fmtNum(snap.frontier.failed)} failed` : undefined} />
        </div>
        <div className="grid [&>*]:min-w-0 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <MiniStat label="Domains crawled" value={fmtNum(m?.domains_crawled)} sub={`${fmtNum(m?.pages_fetched)} pages`} /><MiniStat label="Rejected" value={fmtNum(m?.rejected_domains)} />
          <MiniStat label="Duplicates prevented" value={fmtNum(m?.duplicates_prevented)} /><MiniStat label="Avg confidence" value={fmtPct(m?.avg_confidence)} />
          <MiniStat label="Source queries" value={fmtNum(m?.searches_executed)} sub={`${Object.keys(snap?.cursor_state?.sources ?? {}).length} sources`} /><MiniStat label="LLM calls" value={fmtNum(m?.llm_calls)} sub={`$${(m?.llm_cost_usd ?? 0).toFixed(3)}`} />
        </div>
        <div className="grid [&>*]:min-w-0 gap-4 xl:grid-cols-[1fr_380px]">
          <Panel padded={false} title={<Tabs<Tab> value={tab} onChange={setTab} tabs={[{ id: "activity", label: "Activity" }, { id: "errors", label: "Errors" }, { id: "checkpoints", label: "Checkpoints" }, { id: "changes", label: "Graph changes" }]} />}>
            {tab === "activity" && <ActivityFeed events={events} height="h-[600px]" />}
            {tab === "errors" && <Table head={<><th>Time</th><th>Domain</th><th>Message</th><th>Worker</th></>}>{(errors.data ?? []).map((e: any) => <tr key={e.id}><td className="mono text-xs text-dim">{fmtTime(e.created_at)}</td><td className="mono text-xs">{e.domain}</td><td className="text-red">{e.message}</td><td className="mono text-xs text-dim">{e.worker_id}</td></tr>)}</Table>}
            {tab === "checkpoints" && <Table head={<><th>Created</th><th>Reason</th><th>Frontier</th><th>Processing</th><th>Strategy</th><th>Cursor</th></>}>{(cps.data ?? []).map((c: any) => <tr key={c.id}><td className="text-muted">{fmtDate(c.created_at)} {fmtTime(c.created_at)}</td><td><Badge>{c.reason}</Badge></td><td className="tabular">{fmtNum(c.frontier_count)}</td><td className="tabular">{c.processing_count}</td><td className="mono text-xs">{c.strategy_version}</td><td className="mono text-xs text-dim">{JSON.stringify(c.cursor_state)}</td></tr>)}</Table>}
            {tab === "changes" && <Table head={<><th>Time</th><th>Change</th><th>Entity</th><th>After</th></>}>{(changes.data ?? []).map((c: any) => <tr key={c.id}><td className="mono text-xs text-dim">{fmtTime(c.created_at)}</td><td><Badge tone="green">{c.event_type}</Badge></td><td className="mono text-xs">{c.entity_type}</td><td className="max-w-[420px] truncate text-muted">{JSON.stringify(c.after)}</td></tr>)}</Table>}
          </Panel>
          <div className="space-y-4">
            <Panel title="Discovery sources"><SourceProgress sources={snap?.cursor_state?.sources ?? {}} /></Panel>
            <Panel title="Currently processing"><CurrentJobs snapshot={snap} stages={live.stages} /></Panel>
            <Panel title="Businesses / hour (24h)"><Sparkline points={series.data?.points ?? []} /></Panel>
          </div>
        </div>
      </div>
    </div>
  );
}
