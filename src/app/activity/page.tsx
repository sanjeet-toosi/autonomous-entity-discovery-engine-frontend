"use client";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";
import { useLive } from "@/lib/live";
import { PageHeader } from "@/components/layout/shell";
import { ActivityFeed } from "@/components/control/activity-feed";
import { Button, Panel, Select } from "@/components/ui/primitives";

export default function ActivityPage() {
  const runs = useQuery({ queryKey: ["runs"], queryFn: () => api.runs({ limit: 50 }) });
  const [runId, setRunId] = useState<string>("");
  const [beforeId, setBeforeId] = useState<number | undefined>();
  const live = useLive(runId || null, { global: !runId });
  const history = useQuery({ queryKey: ["activity", runId, beforeId], queryFn: () => api.activity({ run_id: runId || undefined, limit: 300, before_id: beforeId }) });
  const events = [...(beforeId ? [] : live.events), ...(history.data ?? [])];
  const oldest = history.data?.[history.data.length - 1]?.id;
  return (
    <div className="flex h-full min-h-0 flex-col">
      <PageHeader title="Activity" subtitle="Human-readable agent event stream with the raw technical log one toggle away." action={
        <div className="flex items-center gap-2"><Select value={runId} onChange={(e) => { setRunId(e.target.value); setBeforeId(undefined); }}><option value="">All runs</option>{runs.data?.map((r) => <option key={r.id} value={r.id}>{r.mission_prompt} · {r.status}</option>)}</Select>
          {beforeId && <Button size="sm" onClick={() => setBeforeId(undefined)}>Back to live</Button>}</div>} />
      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto p-6">
        <Panel padded={false}><ActivityFeed events={events} height="h-[calc(100vh-260px)]" /></Panel>
        <div className="mt-3 flex justify-end"><Button size="sm" disabled={!oldest} onClick={() => setBeforeId(oldest)}>Load older</Button></div>
      </div>
    </div>
  );
}
