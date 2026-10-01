"use client";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { api } from "@/lib/api";
import { useLive } from "@/lib/live";
import { fmtNum, fmtPct } from "@/lib/utils";
import { PageHeader } from "@/components/layout/shell";
import { MissionInput } from "@/components/control/mission-input";
import { RunController } from "@/components/control/run-controller";
import { MetricCard, MiniStat } from "@/components/control/metric-cards";
import { ActivityFeed } from "@/components/control/activity-feed";
import { CurrentJobs } from "@/components/control/current-jobs";
import { WorkerStatus } from "@/components/control/worker-status";
import { Panel, Select } from "@/components/ui/primitives";

export default function ControlCenter() {
  const [range, setRange] = useState("24h");
  const missions = useQuery({ queryKey: ["missions"], queryFn: api.missions, refetchInterval: 8000 });
  const active = missions.data?.find((m) => m.active_run_id);
  const runId = active?.active_run_id ?? null;
  const run = useQuery({ queryKey: ["run", runId], queryFn: () => api.run(runId!), enabled: !!runId, refetchInterval: 10000 });
  const stats = useQuery({ queryKey: ["stats", range, runId], queryFn: () => api.stats({ range }), refetchInterval: 10000 });
  const live = useLive(runId, { global: true });
  const history = useQuery({ queryKey: ["activity-initial", runId], queryFn: () => api.activity({ run_id: runId ?? undefined, limit: 150 }) });
  const events = [...live.events, ...(history.data ?? [])].slice(0, 400);
  const snap = live.snapshot ?? run.data?.snapshot ?? null;
  const m = stats.data?.metrics;
  return (
    <div className="flex h-full min-h-0 flex-col">
      <PageHeader title="Control Center" subtitle="Start a discovery mission and watch the agent grow the business graph in real time." action={
        <div className="flex items-center gap-2 text-xs text-muted"><span className={live.connected ? "text-accent" : "text-dim"}>●</span> {live.connected ? "live" : "reconnecting"}
          <Select value={range} onChange={(e) => setRange(e.target.value)} className="ml-3"><option value="1h">Last hour</option><option value="24h">Last 24 hours</option><option value="7d">Last 7 days</option><option value="all">Total</option></Select></div>} />
      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto space-y-4 p-6">
        {!runId && <MissionInput />}
        {runId && run.data && <RunController run={run.data} liveStatus={live.runStatus} runtime={snap?.runtime_seconds} />}
        <div className="grid [&>*]:min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Businesses" value={stats.data?.cards.businesses.total} change={stats.data?.cards.businesses.change} changeLabel={`last ${range}`} />
          <MetricCard label="Categories" value={stats.data?.cards.categories.total} change={stats.data?.cards.categories.change} changeLabel={`last ${range}`} tone="violet" />
          <MetricCard label="Graph edges" value={stats.data?.cards.edges.total} change={stats.data?.cards.edges.change} changeLabel={`last ${range}`} tone="blue" />
          <MetricCard label="Candidates" value={stats.data?.cards.candidates.total} change={stats.data?.cards.candidates.change} changeLabel={`last ${range}`} tone="amber" hint={m ? `${fmtNum(m.queue_size)} queued · ${fmtNum(m.processing)} processing` : undefined} />
        </div>
        <div className="grid [&>*]:min-w-0 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <MiniStat label="Domains crawled" value={fmtNum(m?.domains_crawled)} sub={`${fmtNum(m?.pages_fetched)} pages`} />
          <MiniStat label="Valid businesses" value={fmtNum(m?.valid_businesses)} sub={`${fmtNum(m?.rejected_domains)} rejected`} />
          <MiniStat label="Duplicates prevented" value={fmtNum(m?.duplicates_prevented)} sub={`${fmtPct(m?.duplicate_rate)} dup rate`} />
          <MiniStat label="Avg confidence" value={fmtPct(m?.avg_confidence)} />
          <MiniStat label="Businesses / hour" value={fmtNum(m?.businesses_per_hour)} sub={`${fmtNum(m?.new_candidates_per_hour)} new domains/h`} />
          <MiniStat label="Error rate" value={fmtPct(m?.error_rate, 1)} sub={`${fmtNum(m?.crawl_errors)} errors · ${fmtNum(m?.active_workers)} workers`} />
        </div>
        <div className="grid [&>*]:min-w-0 gap-4 xl:grid-cols-[1fr_380px]">
          <Panel title="Live activity" padded={false} action={<Link href="/activity" className="text-xs text-muted hover:text-fg">Full log →</Link>}>
            <ActivityFeed events={events} height="h-[560px]" />
          </Panel>
          <div className="space-y-4">
            <Panel title="Currently processing"><CurrentJobs snapshot={snap} stages={live.stages} /></Panel>
            <Panel title="Workers"><WorkerStatus /></Panel>
            {runId && <Panel title="Frontier">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <MiniStat label="Queued" value={fmtNum(snap?.frontier.queued)} /><MiniStat label="Processing" value={fmtNum(snap?.frontier.processing)} />
                <MiniStat label="Processed" value={fmtNum(snap?.frontier.processed)} /><MiniStat label="Rejected" value={fmtNum(snap?.frontier.rejected)} />
              </div>
              {snap?.cursor_state?.search_index !== undefined && <div className="mt-2 text-xs text-dim">search plan cursor: {snap.cursor_state.search_index}</div>}
            </Panel>}
          </div>
        </div>
        {runId && <div className="rounded-lg border border-dashed border-line p-4 text-sm text-muted">A run is active. Stop it to start a different mission, or <Link href="/runs" className="text-fg underline">manage runs</Link>.</div>}
      </div>
    </div>
  );
}
