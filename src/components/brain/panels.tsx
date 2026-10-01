"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { fmtNum, fmtPct, fmtDate, timeAgo } from "@/lib/utils";
import { Badge, Button, Empty, Panel, Progress, Table, statusTone } from "@/components/ui/primitives";

export function BrainOverview() {
  const q = useQuery({ queryKey: ["brain-overview"], queryFn: api.brainOverview, refetchInterval: 10000 });
  if (!q.data) return <Empty>Loading…</Empty>;
  return (
    <div className="grid [&>*]:min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {q.data.verticals.length === 0 && <Empty>No experiences recorded yet. The Brain learns as runs process domains.</Empty>}
      {q.data.verticals.map((v: any) => (
        <div key={v.vertical} className="rounded-lg border border-line bg-panel/80 p-5">
          <div className="flex items-center justify-between"><div className="text-lg font-semibold capitalize">{v.vertical} Expert</div><Badge tone={v.knowledge_confidence === "high" ? "green" : v.knowledge_confidence === "medium" ? "amber" : "neutral"}>{v.knowledge_confidence} confidence</Badge></div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <Stat k="Domains processed" v={fmtNum(v.experience_count)} /><Stat k="Valid businesses" v={`${fmtNum(v.valid_businesses)} (${fmtPct(v.valid_rate)})`} />
            <Stat k="Current strategy" v={<span className="mono text-xs">{v.active_strategy ?? "—"}</span>} /><Stat k="Validated lessons" v={`${v.validated_lessons} (+${v.proposed_lessons} proposed)`} />
            <Stat k="Active experiments" v={v.active_experiments} />
          </div>
        </div>
      ))}
      <div className="rounded-lg border border-line bg-panel/80 p-5">
        <div className="mono text-[10.5px] uppercase tracking-[0.14em] text-muted">Model usage</div>
        {q.data.models.length === 0 && <div className="mt-2 text-sm text-dim">No model calls yet.</div>}
        {q.data.models.map((m: any) => (
          <div key={m.provider + m.model} className="mt-2 flex items-center justify-between text-sm"><span className="mono text-xs">{m.provider} / {m.model}</span><span className="tabular text-muted">{fmtNum(m.calls)} calls · ${m.cost_usd.toFixed(3)} · {m.avg_latency_ms} ms</span></div>
        ))}
        <div className="mt-3 text-xs text-dim">{q.data.memories} semantic / procedural memories</div>
      </div>
    </div>
  );
}

function Stat({ k, v }: { k: string; v: React.ReactNode }) {
  return <div><div className="mono text-[10px] uppercase tracking-wider text-dim">{k}</div><div className="mt-0.5">{v}</div></div>;
}

export function Strategies() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["brain-strategies"], queryFn: api.brainStrategies });
  const promote = useMutation({ mutationFn: api.promoteStrategy, onSuccess: () => qc.invalidateQueries() });
  const reject = useMutation({ mutationFn: api.rejectStrategy, onSuccess: () => qc.invalidateQueries() });
  if (!q.data) return <Empty>Loading…</Empty>;
  if (q.data.length === 0) return <Empty>No strategies yet — one is bootstrapped when a run starts.</Empty>;
  return (
    <div className="space-y-4">
      {q.data.map((s: any) => (
        <Panel key={s.id} title={<span>{s.name} <span className="normal-case tracking-normal text-dim">· {s.description}</span></span>}>
          <div className="space-y-3">
            {s.versions.map((v: any) => (
              <details key={v.id} className="rounded-md border border-line bg-bg/50" open={v.status === "ACTIVE" || v.status === "TESTING"}>
                <summary className="flex cursor-pointer flex-wrap items-center gap-3 px-3 py-2 text-sm">
                  <span className="mono">{v.label}</span><Badge tone={statusTone(v.status)}>{v.status}</Badge>
                  <span className="text-muted">{v.rationale}</span>
                  <span className="ml-auto mono text-xs text-dim">{fmtDate(v.created_at)}</span>
                  {v.status === "TESTING" && v.metrics?.offline_yield_per_100 !== undefined && <span className="mono text-xs text-amber">offline yield {v.metrics.offline_yield_per_100}/100</span>}
                  {(v.status === "DRAFT" || v.status === "TESTING") && (
                    <span className="flex gap-1"><Button size="sm" variant="primary" onClick={(e) => { e.preventDefault(); promote.mutate(v.id); }}>Promote</Button><Button size="sm" variant="danger" onClick={(e) => { e.preventDefault(); reject.mutate(v.id); }}>Reject</Button></span>
                  )}
                </summary>
                <div className="grid [&>*]:min-w-0 gap-3 border-t border-line p-3 md:grid-cols-2">
                  <div><div className="mono text-[10px] uppercase tracking-wider text-dim">Playbook</div><ol className="mt-1 space-y-1 text-sm text-muted">{v.rules.map((r: any) => <li key={r.step}><span className="mono text-xs text-fg">{r.step}. {r.action}</span> — {r.why}</li>)}</ol></div>
                  <div><div className="mono text-[10px] uppercase tracking-wider text-dim">Configuration</div><pre className="mt-1 max-h-64 overflow-auto rounded bg-bg p-2 text-[11px] text-muted">{JSON.stringify(v.configuration, null, 1)}</pre></div>
                </div>
              </details>
            ))}
          </div>
        </Panel>
      ))}
    </div>
  );
}

export function Lessons() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["brain-lessons"], queryFn: () => api.brainLessons() });
  const set = useMutation({ mutationFn: ({ id, status }: { id: string; status: string }) => api.setLessonStatus(id, status), onSuccess: () => qc.invalidateQueries({ queryKey: ["brain-lessons"] }) });
  if (!q.data) return <Empty>Loading…</Empty>;
  if (q.data.length === 0) return <Empty>No lessons proposed yet. Reflection runs periodically once enough experiences exist, or trigger it manually.</Empty>;
  return (
    <div className="space-y-2">
      {q.data.map((l: any) => (
        <div key={l.id} className="rounded-md border border-line bg-panel/80 p-4">
          <div className="flex flex-wrap items-center gap-2"><Badge tone={statusTone(l.status)}>{l.status}</Badge><Badge tone="violet">{l.lesson_type}</Badge><span className="font-medium">{l.title}</span><span className="ml-auto mono text-xs text-dim">{l.vertical} · {fmtPct(l.confidence)} · {l.experience_count} exp · {timeAgo(l.created_at)}</span></div>
          <p className="mt-2 text-sm text-muted">{l.statement}</p>
          {l.proposed_change && <pre className="mt-2 rounded bg-bg p-2 text-[11px] text-muted">{JSON.stringify(l.proposed_change)}</pre>}
          {l.status === "PROPOSED" && <div className="mt-3 flex gap-2"><Button size="sm" variant="primary" onClick={() => set.mutate({ id: l.id, status: "VALIDATED" })}>Validate</Button><Button size="sm" variant="danger" onClick={() => set.mutate({ id: l.id, status: "REJECTED" })}>Reject</Button></div>}
        </div>
      ))}
    </div>
  );
}

export function SourcePerformance({ limit = 100, compact = false }: { limit?: number; compact?: boolean }) {
  const q = useQuery({ queryKey: ["brain-sources", limit], queryFn: () => api.brainSources({ limit, order: "processed" }), refetchInterval: 15000 });
  if (!q.data) return <Empty>Loading…</Empty>;
  if (q.data.length === 0) return <Empty>No source intelligence yet.</Empty>;
  return (
    <Table head={<><th>Source</th><th>Type</th><th>Seen</th><th>Processed</th><th>Valid rate</th>{!compact && <><th>Novelty</th><th>Dup rate</th><th>Yield</th></>}<th>Score</th></>}>
      {q.data.map((s: any) => (
        <tr key={s.id}>
          <td className="max-w-[320px] truncate" title={s.source}>{s.source}</td><td><Badge>{s.source_type}</Badge></td><td className="tabular">{fmtNum(s.candidates_seen)}</td><td className="tabular">{fmtNum(s.candidates_processed)}</td>
          <td className="w-32"><div className="flex items-center gap-2"><div className="w-16"><Progress value={s.valid_rate} tone={s.valid_rate > 0.5 ? "accent" : s.valid_rate > 0.2 ? "amber" : "red"} /></div><span className="tabular text-xs">{fmtPct(s.valid_rate)}</span></div></td>
          {!compact && <><td className="tabular">{fmtPct(s.novel_domain_rate)}</td><td className="tabular">{fmtPct(s.duplicate_rate)}</td><td className="tabular">{s.avg_yield}</td></>}
          <td className="tabular font-medium">{s.score.toFixed(2)}</td>
        </tr>
      ))}
    </Table>
  );
}

export function Failures() {
  const q = useQuery({ queryKey: ["brain-failures"], queryFn: api.brainFailures, refetchInterval: 15000 });
  if (!q.data) return <Empty>Loading…</Empty>;
  return (
    <div className="grid [&>*]:min-w-0 gap-4 lg:grid-cols-[320px_1fr]">
      <Panel title="Failure types">
        {q.data.summary.length === 0 && <div className="text-sm text-dim">No failures recorded.</div>}
        {q.data.summary.map((f: any) => <div key={f.failure_type} className="flex items-center justify-between py-1 text-sm"><span className="mono text-xs">{f.failure_type}</span><span className="tabular text-muted">{fmtNum(f.occurrences)} <span className="text-dim">/ {f.domains} domains</span></span></div>)}
      </Panel>
      <Panel title="Recent" padded={false}>
        <Table head={<><th>Type</th><th>Domain</th><th>Detail</th><th>Count</th><th>Last</th></>}>
          {q.data.recent.map((f: any, i: number) => <tr key={i}><td><Badge tone="red">{f.failure_type}</Badge></td><td className="mono text-xs">{f.domain}</td><td className="max-w-[360px] truncate text-muted">{f.detail}</td><td className="tabular">{f.count}</td><td className="text-dim">{timeAgo(f.updated_at)}</td></tr>)}
        </Table>
      </Panel>
    </div>
  );
}

export function Experiments() {
  const q = useQuery({ queryKey: ["brain-experiments"], queryFn: api.brainExperiments });
  if (!q.data) return <Empty>Loading…</Empty>;
  if (q.data.length === 0) return <Empty>No experiments. Strategy candidates are evaluated offline against historical experiences when reflection proposes a configuration change.</Empty>;
  return (
    <div className="space-y-3">
      {q.data.map((e: any) => (
        <div key={e.id} className="rounded-md border border-line bg-panel/80 p-4">
          <div className="flex flex-wrap items-center gap-2"><Badge tone={statusTone(e.status)}>{e.status}</Badge><span className="font-medium">{e.hypothesis}</span><span className="ml-auto mono text-xs text-dim">{e.baseline?.label ?? "no baseline"} → {e.candidate?.label} · {e.results.experiences} experiences replayed</span></div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {e.evaluations.map((v: any) => (
              <div key={v.metric} className="rounded border border-line bg-bg/60 p-3 text-sm"><div className="mono text-[10px] uppercase tracking-wider text-dim">{v.metric}</div>
                <div className="mt-1 flex items-baseline gap-3"><span className="text-muted">{v.baseline}</span><span>→</span><span className="font-medium">{v.candidate}</span><span className={`ml-auto tabular ${v.delta_pct > 0 ? "text-accent" : v.delta_pct < 0 ? "text-red" : "text-dim"}`}>{v.delta_pct > 0 ? "+" : ""}{v.delta_pct}%</span></div></div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function Memories() {
  const q = useQuery({ queryKey: ["brain-memories"], queryFn: api.brainMemories });
  if (!q.data) return <Empty>Loading…</Empty>;
  return (
    <div className="grid [&>*]:min-w-0 gap-3 md:grid-cols-2">
      {q.data.map((m: any) => (
        <div key={m.id} className="rounded-md border border-line bg-panel/80 p-4 text-sm">
          <div className="flex items-center gap-2"><Badge tone={m.memory_type === "semantic" ? "blue" : "violet"}>{m.memory_type}</Badge><span className="mono text-xs text-dim">{m.key}</span><span className="ml-auto text-xs text-dim">{fmtPct(m.confidence)}</span></div>
          <div className="mt-2 text-muted">{m.content.statement ?? <ol className="list-decimal pl-4">{m.content.steps?.map((s: any) => <li key={s.step}>{s.action}</li>)}</ol>}</div>
        </div>
      ))}
    </div>
  );
}
