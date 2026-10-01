"use client";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";
import { fmtNum, fmtPct, fmtDate, fmtTime } from "@/lib/utils";
import { PageHeader } from "@/components/layout/shell";
import { MetricCard } from "@/components/control/metric-cards";
import { BusinessDrawer } from "@/components/graph/business-drawer";
import { Badge, Confidence, Empty, Panel, Table } from "@/components/ui/primitives";

export default function CategoryDetail() {
  const { id } = useParams<{ id: string }>();
  const [selected, setSelected] = useState<string | null>(null);
  const q = useQuery({ queryKey: ["category", id], queryFn: () => api.category(id), refetchInterval: 15000 });
  const c = q.data;
  if (!c) return <Empty>Loading…</Empty>;
  return (
    <div className="flex h-full min-h-0 flex-col">
      <PageHeader title={c.name} subtitle={<span>Parent: {c.parent ? <Link href={`/categories/${c.parent.id}`} className="text-fg hover:underline">{c.parent.name}</Link> : "Business"} · <span className="mono text-xs">{c.path}</span></span>} />
      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto space-y-4 p-6">
        <div className="grid [&>*]:min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Businesses" value={c.business_count} change={c.added_24h} compact={false} />
          <MetricCard label="Subcategories" value={c.subcategory_count} tone="violet" compact={false} />
          <div className="rounded-lg border border-line bg-panel/80 p-4"><div className="mono text-[10.5px] uppercase tracking-[0.14em] text-muted">Avg classification confidence</div><div className="mt-2 tabular text-3xl font-semibold text-blue">{fmtPct(c.avg_confidence, 1)}</div></div>
          <div className="rounded-lg border border-line bg-panel/80 p-4"><div className="mono text-[10.5px] uppercase tracking-[0.14em] text-muted">Created</div><div className="mt-2 text-lg">{fmtDate(c.created_at)}</div><div className="text-xs text-dim">by {c.created_by} · {c.status}</div></div>
        </div>
        <div className="grid [&>*]:min-w-0 gap-4 lg:grid-cols-3">
          <Panel title="Subcategories">{c.subcategories.length === 0 ? <div className="text-sm text-dim">None</div> : c.subcategories.map((s: any) => <Link key={s.id} href={`/categories/${s.id}`} className="flex items-center justify-between py-1.5 text-sm hover:text-accent"><span>{s.name}</span><span className="tabular text-muted">{fmtNum(s.business_count)}</span></Link>)}</Panel>
          <Panel title="Top countries">{c.top_countries.length === 0 ? <div className="text-sm text-dim">No geography yet</div> : c.top_countries.map((t: any) => <div key={t.country} className="flex items-center justify-between py-1.5 text-sm"><span className="mono">{t.country}</span><span className="tabular text-muted">{fmtNum(t.count)}</span></div>)}</Panel>
          <Panel title="Taxonomy history">{c.history.length === 0 ? <div className="text-sm text-dim">No changes</div> : c.history.map((h: any, i: number) => <div key={i} className="flex items-center justify-between py-1.5 text-sm"><Badge tone="amber">{h.event_type}</Badge><span className="mono text-xs text-dim">{fmtDate(h.created_at)} {fmtTime(h.created_at)}</span></div>)}</Panel>
        </div>
        <Panel title="Recent additions" padded={false}>
          {c.recent.length === 0 ? <Empty>No businesses yet.</Empty> : (
            <Table head={<><th>Domain</th><th>Name</th><th>Location</th><th>Confidence</th><th>Discovered</th></>}>
              {c.recent.map((b: any) => <tr key={b.id} className="cursor-pointer" onClick={() => setSelected(b.id)}><td className="mono text-xs">{b.domain}</td><td>{b.name ?? "—"}</td><td className="text-muted">{[b.city, b.region, b.country_code].filter(Boolean).join(", ") || "—"}</td><td><Confidence value={b.confidence} /></td><td className="text-dim">{fmtDate(b.first_seen_at)}</td></tr>)}
            </Table>
          )}
        </Panel>
      </div>
      <BusinessDrawer id={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
