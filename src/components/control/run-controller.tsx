"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Pause, Play, Square, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { api, type Run, type RunStatus } from "@/lib/api";
import { fmtDuration } from "@/lib/utils";
import { Badge, Button, StatusDot, statusTone } from "@/components/ui/primitives";

export function RunController({ run, liveStatus, runtime }: { run: Run; liveStatus?: string | null; runtime?: number }) {
  const qc = useQueryClient();
  const status = (liveStatus ?? run.status) as RunStatus;
  const [tick, setTick] = useState(0);
  useEffect(() => { const t = setInterval(() => setTick((x) => x + 1), 1000); return () => clearInterval(t); }, []);
  const base = runtime ?? run.runtime_seconds;
  const elapsed = status === "RUNNING" ? base + tick * 0 + (Date.now() - stamp(run, runtime)) / 1000 : base;
  const done = () => qc.invalidateQueries();
  const pause = useMutation({ mutationFn: () => api.pause(run.id), onSuccess: done });
  const resume = useMutation({ mutationFn: () => api.resume(run.id), onSuccess: done });
  const stop = useMutation({ mutationFn: () => api.stop(run.id), onSuccess: done });
  const cont = useMutation({ mutationFn: () => api.continueRun(run.id), onSuccess: done });
  const busy = pause.isPending || resume.isPending || stop.isPending || cont.isPending;
  const terminal = ["STOPPED", "COMPLETED", "FAILED"].includes(status);
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-line bg-panel/80 p-5">
      <div className="min-w-0">
        <div className="mono text-[11px] uppercase tracking-[0.14em] text-muted">Mission</div>
        <div className="mt-1 truncate text-lg font-medium">{run.mission_prompt}</div>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <Badge tone={statusTone(status)}><StatusDot status={status} /> {status}</Badge>
          <span className="mono tabular text-sm text-muted">Runtime {fmtDuration(Math.max(0, elapsed))}</span>
          {run.strategy_version && <span className="mono text-xs text-dim">strategy {run.strategy_version}</span>}
        </div>
      </div>
      <div className="flex gap-2">
        {(status === "RUNNING" || status === "STARTING" || status === "RESUMING") && <Button variant="warn" onClick={() => pause.mutate()} disabled={busy}><Pause size={15} /> Pause</Button>}
        {(status === "PAUSED") && <Button variant="primary" onClick={() => resume.mutate()} disabled={busy}><Play size={15} /> Resume</Button>}
        {!terminal && <Button variant="danger" onClick={() => stop.mutate()} disabled={busy || status === "STOPPING"}><Square size={15} /> Stop</Button>}
        {terminal && status !== "FAILED" && <Button variant="primary" onClick={() => cont.mutate()} disabled={busy}><RotateCcw size={15} /> Continue from checkpoint</Button>}
      </div>
    </div>
  );
}

// Runtime shown live: server sends `runtime_seconds` in snapshots; we extrapolate between them.
const stamps = new WeakMap<object, number>();
function stamp(run: Run, runtime?: number): number {
  const key = run;
  const now = Date.now();
  if (runtime !== undefined) { stamps.set(key, now); return now; }
  if (!stamps.has(key)) stamps.set(key, now);
  return stamps.get(key)!;
}
