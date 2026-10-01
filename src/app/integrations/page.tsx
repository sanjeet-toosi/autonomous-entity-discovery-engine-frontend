"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api, type Integration } from "@/lib/api";
import { timeAgo } from "@/lib/utils";
import { PageHeader } from "@/components/layout/shell";
import { Badge, Button, Empty, Input, Panel } from "@/components/ui/primitives";

const KIND: Record<Integration["kind"], { label: string; tone: "green" | "amber" | "blue" }> = {
  free: { label: "free", tone: "green" }, paid_api: { label: "paid API", tone: "amber" }, registry: { label: "registry", tone: "blue" },
};

export default function IntegrationsPage() {
  const q = useQuery({ queryKey: ["integrations"], queryFn: api.integrations, refetchInterval: 15000 });
  return (
    <div className="flex h-full min-h-0 flex-col">
      <PageHeader title="Discovery sources" subtitle="Free sources run by default. Paid APIs and registries run only when you enable them here; keys are stored server-side and never shown again in full." />
      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto p-6">
        {q.isError && <Empty>Could not load integrations: {(q.error as Error).message}</Empty>}
        <div className="grid [&>*]:min-w-0 gap-4 lg:grid-cols-2">
          {(q.data ?? []).map((i) => <SourceCard key={i.key} i={i} />)}
        </div>
      </div>
    </div>
  );
}

function SourceCard({ i }: { i: Integration }) {
  const qc = useQueryClient();
  const [keyDraft, setKeyDraft] = useState("");
  const [cfg, setCfg] = useState<Record<string, unknown>>(i.config);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(i.status.last_test ?? null);
  const update = useMutation({
    mutationFn: (body: Parameters<typeof api.updateIntegration>[1]) => api.updateIntegration(i.key, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["integrations"] }),
  });
  const test = useMutation({ mutationFn: () => api.testIntegration(i.key), onSuccess: (r) => { setTestResult(r); qc.invalidateQueries({ queryKey: ["integrations"] }); } });
  const needsKey = i.requires_key && !i.has_key;
  return (
    <Panel
      title={<span className="flex items-center gap-2">{i.label} <Badge tone={KIND[i.kind].tone}>{KIND[i.kind].label}</Badge></span>}
      action={
        <label className="flex cursor-pointer items-center gap-2 text-xs text-muted">
          <span>{i.enabled ? "enabled" : "disabled"}</span>
          <input type="checkbox" className="h-4 w-4 accent-[var(--color-accent)]" checked={i.enabled} disabled={update.isPending}
            onChange={(e) => update.mutate({ enabled: e.target.checked })} />
        </label>
      }
    >
      <p className="text-sm text-muted">{i.description}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
        <Badge tone={i.usable ? "green" : i.enabled ? "red" : "neutral"}>{i.usable ? "will run" : i.enabled ? "enabled but missing key" : "off"}</Badge>
        {i.docs_url && <a className="text-dim underline hover:text-fg" href={i.docs_url} target="_blank" rel="noreferrer">docs</a>}
        {testResult && <span className={testResult.ok ? "text-accent" : "text-red"}>test: {testResult.message}{i.status.last_test?.tested_at ? ` · ${timeAgo(i.status.last_test.tested_at)}` : ""}</span>}
      </div>

      {i.requires_key && (
        <div className="mt-3">
          <div className="mono text-[10px] uppercase tracking-wider text-dim">API key {i.has_key && <span className="normal-case tracking-normal text-muted">· saved {i.api_key_masked}</span>}</div>
          <form className="mt-1 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (keyDraft.trim()) update.mutate({ api_key: keyDraft.trim() }, { onSuccess: () => setKeyDraft("") }); }}>
            <Input type="password" autoComplete="off" placeholder={i.has_key ? "Replace key…" : "Paste API key"} value={keyDraft} onChange={(e) => setKeyDraft(e.target.value)} />
            <Button type="submit" variant="primary" size="md" disabled={!keyDraft.trim() || update.isPending}>Save</Button>
            {i.has_key && <Button type="button" variant="danger" size="md" disabled={update.isPending} onClick={() => update.mutate({ clear_key: true })}>Remove</Button>}
          </form>
          {needsKey && i.enabled && <div className="mt-1 text-xs text-amber">Enabled, but it will not run until a key is saved.</div>}
        </div>
      )}

      {i.config_fields.length > 0 && (
        <div className="mt-3">
          <div className="mono text-[10px] uppercase tracking-wider text-dim">Options</div>
          <div className="mt-1 grid gap-2 sm:grid-cols-2">
            {i.config_fields.map((f) => (
              <label key={f.key} className="text-xs text-muted">
                <span className="block">{f.label}</span>
                {f.type === "boolean" ? (
                  <input type="checkbox" className="mt-1 h-4 w-4" checked={Boolean(cfg[f.key] ?? f.default)} onChange={(e) => setCfg({ ...cfg, [f.key]: e.target.checked })} />
                ) : (
                  <Input type={f.type === "number" ? "number" : "text"} value={String(cfg[f.key] ?? f.default ?? "")}
                    onChange={(e) => setCfg({ ...cfg, [f.key]: f.type === "number" ? Number(e.target.value) : e.target.value })} />
                )}
              </label>
            ))}
          </div>
          <Button className="mt-2" size="sm" disabled={update.isPending || JSON.stringify(cfg) === JSON.stringify(i.config)} onClick={() => update.mutate({ config: cfg })}>Save options</Button>
        </div>
      )}

      <div className="mt-3 flex items-center gap-2">
        <Button size="sm" disabled={test.isPending || (i.requires_key && !i.has_key)} onClick={() => test.mutate()}>{test.isPending ? "Testing…" : "Test connection"}</Button>
        {update.isError && <span className="text-xs text-red">{(update.error as Error).message}</span>}
      </div>
    </Panel>
  );
}
