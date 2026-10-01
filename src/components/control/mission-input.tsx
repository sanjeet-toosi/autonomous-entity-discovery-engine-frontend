"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/primitives";

export function MissionInput() {
  const [prompt, setPrompt] = useState("Find all restaurants in the US");
  const [preview, setPreview] = useState<{ interpretation: Record<string, any>; provider: string } | null>(null);
  const qc = useQueryClient();
  const router = useRouter();
  const interpret = useMutation({ mutationFn: api.interpret, onSuccess: (d) => setPreview(d) });
  const start = useMutation({
    mutationFn: () => api.createMission(prompt, true),
    onSuccess: (m) => { qc.invalidateQueries(); if (m.active_run_id) router.push(`/runs/${m.active_run_id}`); },
  });
  const interp = preview?.interpretation;
  return (
    <div className="relative overflow-hidden rounded-lg border border-line bg-panel/80">
      <div className="grid-bg pointer-events-none absolute inset-0 opacity-60" />
      <div className="relative p-5">
        <div className="mono text-[11px] uppercase tracking-[0.14em] text-muted">What should the agent discover?</div>
        <form className="mt-3 flex flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); start.mutate(); }}>
          <input value={prompt} onChange={(e) => { setPrompt(e.target.value); setPreview(null); }} className="h-12 min-w-[280px] flex-1 rounded-md border border-line-strong bg-bg px-4 text-lg text-fg placeholder:text-dim focus:border-accent/60 focus:outline-none" placeholder="Find all restaurants in the US" />
          <Button type="button" variant="secondary" size="lg" onClick={() => interpret.mutate(prompt)} disabled={!prompt || interpret.isPending}>
            {interpret.isPending ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />} Interpret
          </Button>
          <Button type="submit" variant="primary" size="lg" disabled={!prompt || start.isPending}>
            {start.isPending ? <Loader2 size={16} className="animate-spin" /> : null} Start Discovery
          </Button>
        </form>
        {start.isError && <div className="mt-2 text-sm text-red">{(start.error as Error).message}</div>}
        {interp && (
          <div className="mt-4 grid gap-3 rounded-md border border-line bg-bg/70 p-4 text-sm sm:grid-cols-2 lg:grid-cols-5">
            <Item k="Target entity" v={interp.entity_type} />
            <Item k="Vertical" v={interp.vertical} sub={interp.related_verticals?.join(", ")} />
            <Item k="Geography" v={interp.geography?.country ?? "Global"} sub={interp.geography?.regions?.join(", ")} />
            <Item k="Discovery mode" v={interp.discovery_mode} sub={interp.completion_strategy} />
            <Item k="Primary objective" v={interp.objective} />
            <div className="col-span-full text-xs text-dim">Category root: <span className="text-muted">{interp.category_root}</span> · Signals: <span className="text-muted">{interp.keywords?.slice(0, 8).join(", ")}</span> · planner: <span className="mono">{preview?.provider}</span></div>
          </div>
        )}
      </div>
    </div>
  );
}

function Item({ k, v, sub }: { k: string; v: React.ReactNode; sub?: string }) {
  return (
    <div>
      <div className="mono text-[10px] uppercase tracking-wider text-dim">{k}</div>
      <div className="mt-0.5 capitalize text-fg">{v}</div>
      {sub && <div className="truncate text-[11px] text-dim">{sub}</div>}
    </div>
  );
}
