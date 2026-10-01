"use client";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { api } from "@/lib/api";
import { fmtDate, fmtTime, timeAgo } from "@/lib/utils";
import { Drawer } from "@/components/ui/drawer";
import { Badge, Confidence, Empty, Kv, Table, Tabs, statusTone } from "@/components/ui/primitives";

type Tab = "overview" | "categories" | "evidence" | "relationships" | "pages" | "history" | "activity" | "discoveries";

export function BusinessDrawer({ id, onClose }: { id: string | null; onClose: () => void }) {
  const [tab, setTab] = useState<Tab>("overview");
  const b = useQuery({ queryKey: ["business", id], queryFn: () => api.business(id!), enabled: !!id });
  return (
    <Drawer open={!!id} onClose={onClose} title={b.data ? (
      <div>
        <div className="flex items-center gap-2"><span className="mono text-sm text-muted">{b.data.domain}</span><a href={`https://${b.data.domain}`} target="_blank" rel="noreferrer" className="text-dim hover:text-fg"><ExternalLink size={13} /></a></div>
        <div className="mt-0.5 text-xl font-semibold">{b.data.name ?? b.data.domain}</div>
      </div>
    ) : <div className="text-muted">Loading…</div>}>
      {b.data && (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {b.data.categories?.map((c) => <Link key={c.id} href={`/categories/${c.id}`}><Badge tone="green">{c.name}</Badge></Link>)}
            <Badge tone={statusTone(b.data.status)}>{b.data.status}</Badge>
            <Badge>{b.data.business_type}</Badge>
          </div>
          <Tabs<Tab> value={tab} onChange={setTab} tabs={[
            { id: "overview", label: "Overview" }, { id: "categories", label: "Categories" }, { id: "evidence", label: "Evidence" }, { id: "relationships", label: "Relationships" },
            { id: "pages", label: "Pages" }, { id: "history", label: "History" }, { id: "activity", label: "Agent Activity" }, { id: "discoveries", label: "Discoveries" },
          ]} />
          <div className="pt-4">
            {tab === "overview" && <Overview b={b.data} />}
            {tab === "categories" && <Categories b={b.data} />}
            {tab === "evidence" && <List queryKey={["biz-evidence", id]} fn={() => api.businessEvidence(id!)} render={(e: any) => (
              <div className="rounded-md border border-line p-3 text-sm"><div className="flex items-center justify-between gap-3"><span className="text-fg">{e.claim}</span><Badge tone="violet">{e.evidence_type}</Badge></div>
                <div className="mt-1 break-words text-muted">{e.value}</div><div className="mt-1 flex items-center justify-between text-[11px] text-dim"><span className="truncate">{e.source_url}</span><Confidence value={e.confidence} /></div></div>)} />}
            {tab === "relationships" && <List queryKey={["biz-rel", id]} fn={() => api.businessRelationships(id!)} render={(r: any) => (
              <div className="flex items-center gap-2 rounded-md border border-line p-2.5 text-sm"><span className="truncate">{r.source.label}</span><Badge tone="blue">{r.relationship_type}</Badge><span className="truncate">{r.target.label}</span><span className="ml-auto mono text-xs text-dim">{Math.round(r.confidence * 100)}% · {r.evidence_count}x</span></div>)} />}
            {tab === "pages" && <List queryKey={["biz-pages", id]} fn={() => api.businessPages(id!)} render={(p: any) => (
              <div className="rounded-md border border-line p-3 text-sm"><div className="flex items-center justify-between gap-3"><span className="truncate text-fg">{p.final_url ?? p.url}</span><Badge tone={p.status_code < 400 ? "green" : "red"}>{p.status_code}</Badge></div>
                <div className="mt-1 truncate text-muted">{p.title}</div><div className="mt-1 text-[11px] text-dim">{p.fetch_ms} ms · {p.schema_types?.join(", ") || "no structured data"} · {p.external_domains} outbound domains · {timeAgo(p.fetched_at)}</div></div>)} />}
            {tab === "history" && <List queryKey={["biz-hist", id]} fn={() => api.businessHistory(id!)} render={(h: any) => (
              <div className="rounded-md border border-line p-3 text-sm"><div className="flex items-center justify-between"><Badge tone="amber">{h.event_type}</Badge><span className="mono text-xs text-dim">{fmtDate(h.created_at)} {fmtTime(h.created_at)}</span></div>
                <pre className="mt-2 max-h-40 overflow-auto rounded bg-bg p-2 text-[11px] text-muted">{JSON.stringify({ before: h.before, after: h.after }, null, 1)}</pre></div>)} />}
            {tab === "activity" && <List queryKey={["biz-act", id]} fn={() => api.businessActivity(id!)} render={(e: any) => (
              <div className="flex gap-3 border-b border-line/50 py-1 font-mono text-xs"><span className="text-dim">{fmtTime(e.created_at)}</span><span className="w-16 uppercase text-dim">{e.category}</span><span className="text-fg/90">{e.message}</span></div>)} />}
            {tab === "discoveries" && <List queryKey={["biz-disc", id]} fn={() => api.businessDiscoveries(id!)} render={(d: any) => (
              <div className="flex items-center gap-3 border-b border-line/50 py-1.5 text-sm"><span className="flex-1 truncate">{d.domain}</span><Badge tone={statusTone(d.status)}>{d.status}</Badge><span className="mono text-xs text-dim">p={d.priority.toFixed(2)}</span></div>)} />}
          </div>
        </>
      )}
    </Drawer>
  );
}

function Overview({ b }: { b: any }) {
  return (
    <div className="space-y-4">
      {b.description && <p className="text-sm text-muted">{b.description}</p>}
      <div className="grid [&>*]:min-w-0 gap-x-8 sm:grid-cols-2">
        <div>
          <Kv k="City" v={b.city ?? "—"} /><Kv k="Region" v={b.region ?? "—"} /><Kv k="Country" v={b.country_code ?? "—"} /><Kv k="Language" v={b.language ?? "—"} />
        </div>
        <div>
          <Kv k="Confidence" v={<Confidence value={b.confidence} />} /><Kv k="First discovered" v={fmtDate(b.first_seen_at)} /><Kv k="Last verified" v={fmtDate(b.last_verified_at)} />
          <Kv k="Discovery source" v={<span className="mono text-xs">{b.source_type} · {b.source_reference ?? "—"}</span>} />
        </div>
      </div>
      <div>
        <div className="mono text-[10.5px] uppercase tracking-wider text-dim">Metadata</div>
        <pre className="mt-1 max-h-48 overflow-auto rounded bg-bg p-3 text-[11px] text-muted">{JSON.stringify(b.metadata, null, 1)}</pre>
      </div>
    </div>
  );
}

function Categories({ b }: { b: any }) {
  if (!b.categories?.length) return <Empty>Uncategorized</Empty>;
  return (
    <div className="space-y-2">
      {b.categories.map((c: any, i: number) => (
        <Link key={c.id} href={`/categories/${c.id}`} className="flex items-center gap-3 rounded-md border border-line p-3 text-sm hover:border-line-strong" style={{ marginLeft: i * 16 }}>
          <span className="mono text-[10px] text-dim">L{c.depth}</span><span>{c.name}</span><span className="ml-auto mono text-xs text-dim">{c.slug}</span>
        </Link>
      ))}
    </div>
  );
}

function List({ queryKey, fn, render }: { queryKey: any[]; fn: () => Promise<any[]>; render: (item: any) => React.ReactNode }) {
  const q = useQuery({ queryKey, queryFn: fn });
  if (q.isLoading) return <Empty>Loading…</Empty>;
  if (!q.data?.length) return <Empty>Nothing recorded yet.</Empty>;
  return <div className="space-y-2">{q.data.map((item, i) => <div key={item.id ?? i}>{render(item)}</div>)}</div>;
}
