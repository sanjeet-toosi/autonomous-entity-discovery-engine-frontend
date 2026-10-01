"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/layout/shell";
import { Button, Tabs } from "@/components/ui/primitives";
import { BrainOverview, Experiments, Failures, Lessons, Memories, SourcePerformance, Strategies } from "@/components/brain/panels";

type Tab = "overview" | "strategies" | "lessons" | "sources" | "failures" | "experiments" | "memories";

export default function BrainPage() {
  const [tab, setTab] = useState<Tab>("overview");
  const qc = useQueryClient();
  const missions = useQuery({ queryKey: ["missions"], queryFn: api.missions });
  const reflect = useMutation({ mutationFn: (id: string) => api.reflect(id), onSuccess: () => qc.invalidateQueries() });
  const target = missions.data?.[0];
  return (
    <div className="flex h-full min-h-0 flex-col">
      <PageHeader title="Brain" subtitle="What the agent has learned about how to discover — separate from what it knows about businesses." action={
        target && <Button variant="secondary" onClick={() => reflect.mutate(target.id)} disabled={reflect.isPending}>{reflect.isPending ? "Reflecting…" : "Run reflection now"}</Button>} />
      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto space-y-4 p-6">
        {reflect.data && <div className="rounded-md border border-amber/30 bg-amber-dim p-3 text-sm text-amber">{reflect.data.skipped ? reflect.data.reason : `${reflect.data.summary} — ${reflect.data.lessons.length} lesson(s) proposed via ${reflect.data.provider}.`}</div>}
        <Tabs<Tab> value={tab} onChange={setTab} tabs={[{ id: "overview", label: "Overview" }, { id: "strategies", label: "Strategies" }, { id: "lessons", label: "Lessons" }, { id: "sources", label: "Source Intelligence" }, { id: "failures", label: "Failures" }, { id: "experiments", label: "Experiments" }, { id: "memories", label: "Learned Knowledge" }]} />
        {tab === "overview" && <BrainOverview />}
        {tab === "strategies" && <Strategies />}
        {tab === "lessons" && <Lessons />}
        {tab === "sources" && <div className="rounded-lg border border-line bg-panel/80"><SourcePerformance /></div>}
        {tab === "failures" && <Failures />}
        {tab === "experiments" && <Experiments />}
        {tab === "memories" && <Memories />}
      </div>
    </div>
  );
}
