"use client";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";
import { fmtNum, fmtDate } from "@/lib/utils";
import { PageHeader } from "@/components/layout/shell";
import { BusinessDrawer } from "@/components/graph/business-drawer";
import { Badge, Button, Confidence, Empty, Input, Select, Table } from "@/components/ui/primitives";

export default function BusinessesPage() {
  const [q, setQ] = useState("");
  const [country, setCountry] = useState("");
  const [order, setOrder] = useState("recent");
  const [conf, setConf] = useState("");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const limit = 50;
  const list = useQuery({ queryKey: ["businesses", q, country, order, conf, page], queryFn: () => api.businesses({ q, country, order, confidence_min: conf, limit, offset: page * limit }), refetchInterval: 15000 });
  const total = list.data?.total ?? 0;
  return (
    <div className="flex h-full min-h-0 flex-col">
      <PageHeader title="Businesses" subtitle={`${fmtNum(total)} validated business nodes`} />
      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto space-y-3 p-6">
        <div className="flex flex-wrap gap-2">
          <Input value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} placeholder="Search domain or name…" className="max-w-xs" />
          <Input value={country} onChange={(e) => { setCountry(e.target.value.toUpperCase()); setPage(0); }} placeholder="Country" className="w-24" />
          <Select value={conf} onChange={(e) => { setConf(e.target.value); setPage(0); }}><option value="">Any confidence</option><option value="0.5">≥ 50%</option><option value="0.8">≥ 80%</option><option value="0.9">≥ 90%</option></Select>
          <Select value={order} onChange={(e) => setOrder(e.target.value)}><option value="recent">Most recent</option><option value="confidence">Highest confidence</option></Select>
        </div>
        <div className="rounded-lg border border-line bg-panel/80">
          {list.data?.items.length === 0 ? <Empty>No businesses match.</Empty> : (
            <Table head={<><th>Domain</th><th>Name</th><th>Category</th><th>Location</th><th>Confidence</th><th>Discovered</th></>}>
              {(list.data?.items ?? []).map((b) => (
                <tr key={b.id} onClick={() => setSelected(b.id)} className="cursor-pointer">
                  <td className="mono text-xs">{b.domain}</td><td className="max-w-[260px] truncate">{b.name ?? <span className="text-dim">—</span>}</td>
                  <td>{b.primary_category ? <Badge tone="green">{b.primary_category.name}</Badge> : <span className="text-dim">—</span>}</td>
                  <td className="text-muted">{[b.city, b.region, b.country_code].filter(Boolean).join(", ") || "—"}</td>
                  <td><Confidence value={b.confidence} /></td><td className="text-dim">{fmtDate(b.first_seen_at)}</td>
                </tr>
              ))}
            </Table>
          )}
        </div>
        <div className="flex items-center justify-between text-sm text-muted">
          <span>Page {page + 1} of {Math.max(1, Math.ceil(total / limit))}</span>
          <div className="flex gap-2"><Button size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Previous</Button><Button size="sm" disabled={(page + 1) * limit >= total} onClick={() => setPage((p) => p + 1)}>Next</Button></div>
        </div>
      </div>
      <BusinessDrawer id={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
