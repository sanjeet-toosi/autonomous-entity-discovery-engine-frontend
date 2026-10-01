"use client";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { ChevronDown, ChevronRight, Search } from "lucide-react";
import { api, type Business, type CategoryNode } from "@/lib/api";
import { cn, fmtNum } from "@/lib/utils";
import { Button, Confidence, Empty, Input, Select } from "@/components/ui/primitives";

export type GraphFilters = { country?: string; confidence_min?: number; last_24h?: boolean; [k: string]: unknown };

export function GraphExplorer({ onSelectBusiness }: { onSelectBusiness: (id: string) => void }) {
  const [filters, setFilters] = useState<GraphFilters>({});
  const [q, setQ] = useState("");
  const root = useQuery({ queryKey: ["graph-root", filters], queryFn: () => api.graphRoot(filters), refetchInterval: 15000 });
  const search = useQuery({ queryKey: ["graph-search", q], queryFn: () => api.graphSearch(q), enabled: q.length >= 2 });
  return (
    <div className="grid [&>*]:min-w-0 gap-4 lg:grid-cols-[1fr_320px]">
      <div className="rounded-lg border border-line bg-panel/80">
        <div className="flex flex-wrap items-center gap-2 border-b border-line px-3 py-2">
          <div className="relative min-w-[220px] flex-1"><Search size={14} className="absolute left-2.5 top-2.5 text-dim" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search category or domain…" className="pl-8" /></div>
          <Input value={filters.country ?? ""} onChange={(e) => setFilters((f) => ({ ...f, country: e.target.value.toUpperCase() || undefined }))} placeholder="Country (US)" className="w-28" />
          <Select value={filters.confidence_min ?? ""} onChange={(e) => setFilters((f) => ({ ...f, confidence_min: e.target.value ? Number(e.target.value) : undefined }))}>
            <option value="">Any confidence</option><option value="0.5">≥ 50%</option><option value="0.8">≥ 80%</option><option value="0.9">≥ 90%</option>
          </Select>
          <Button size="sm" variant={filters.last_24h ? "primary" : "secondary"} onClick={() => setFilters((f) => ({ ...f, last_24h: !f.last_24h || undefined }))}>Last 24h only</Button>
        </div>
        <div className="p-3 font-mono text-[13px]">
          {q.length >= 2 ? (
            <SearchResults data={search.data} onSelectBusiness={onSelectBusiness} />
          ) : root.data ? (
            <>
              <div className="flex items-center gap-2 py-1 text-fg"><span className="text-accent">●</span> Business <span className="ml-auto tabular text-muted">{fmtNum(root.data.root.business_count)}</span></div>
              <div className="ml-2 border-l border-line pl-3">
                {root.data.children.length === 0 && <Empty>The graph is empty. Start a mission and categories will appear here as businesses are classified.</Empty>}
                {root.data.children.map((c) => <Node key={c.id} node={c} filters={filters} onSelectBusiness={onSelectBusiness} depth={1} />)}
              </div>
            </>
          ) : (
            <Empty>Loading graph…</Empty>
          )}
        </div>
      </div>
      <Legend />
    </div>
  );
}

function Node({ node, filters, onSelectBusiness, depth }: { node: CategoryNode; filters: GraphFilters; onSelectBusiness: (id: string) => void; depth: number }) {
  const [open, setOpen] = useState(depth < 2);
  const [showBiz, setShowBiz] = useState(false);
  const kids = useQuery({ queryKey: ["graph-children", node.id, filters], queryFn: () => api.graphChildren(node.id, filters), enabled: open && node.subcategory_count > 0 });
  const biz = useQuery({ queryKey: ["graph-biz", node.id, filters], queryFn: () => api.graphBusinesses(node.id, { ...filters, limit: 25 }), enabled: showBiz });
  const expandable = node.subcategory_count > 0;
  return (
    <div>
      <div className={cn("group flex items-center gap-1.5 rounded px-1 py-1 hover:bg-elev/70", open && "text-fg")}>
        <button onClick={() => setOpen((o) => !o)} className={cn("text-dim", !expandable && "invisible")}>{open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</button>
        <Link href={`/categories/${node.id}`} className="hover:underline">{node.name}</Link>
        {node.added_24h > 0 && <span className="rounded bg-accent-dim px-1 text-[10px] text-accent">+{fmtNum(node.added_24h, true)}</span>}
        <button onClick={() => setShowBiz((s) => !s)} className="ml-auto tabular text-muted hover:text-fg" title="Show businesses">{fmtNum(node.business_count, true)}</button>
      </div>
      {(open || showBiz) && (
        <div className="ml-2 border-l border-line pl-3">
          {open && kids.data?.map((k) => <Node key={k.id} node={k} filters={filters} onSelectBusiness={onSelectBusiness} depth={depth + 1} />)}
          {showBiz && biz.data?.items.map((b) => <BizRow key={b.id} b={b} onClick={() => onSelectBusiness(b.id)} />)}
          {showBiz && biz.data?.items.length === 0 && <div className="py-1 text-dim">no businesses match filters</div>}
          {showBiz && biz.data?.next_cursor && <div className="py-1 text-[11px] text-dim">showing first 25 · open category for all</div>}
        </div>
      )}
    </div>
  );
}

function BizRow({ b, onClick }: { b: Business; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-2 rounded px-1 py-0.5 text-left text-muted hover:bg-elev/70 hover:text-fg">
      <span className="text-blue">▸</span><span className="truncate">{b.domain}</span>
      {b.country_code && <span className="text-[10px] text-dim">{b.country_code}</span>}
      <span className="ml-auto"><Confidence value={b.confidence} /></span>
    </button>
  );
}

function SearchResults({ data, onSelectBusiness }: { data?: { categories: any[]; businesses: Business[] }; onSelectBusiness: (id: string) => void }) {
  if (!data) return <Empty>Searching…</Empty>;
  return (
    <div className="space-y-3">
      <div>
        <div className="mb-1 text-[10px] uppercase tracking-wider text-dim">Categories</div>
        {data.categories.length === 0 && <div className="text-dim">none</div>}
        {data.categories.map((c) => <Link key={c.id} href={`/categories/${c.id}`} className="block rounded px-1 py-0.5 hover:bg-elev/70">{c.name} <span className="text-dim">{c.path}</span></Link>)}
      </div>
      <div>
        <div className="mb-1 text-[10px] uppercase tracking-wider text-dim">Businesses</div>
        {data.businesses.length === 0 && <div className="text-dim">none</div>}
        {data.businesses.map((b) => <BizRow key={b.id} b={b} onClick={() => onSelectBusiness(b.id)} />)}
      </div>
    </div>
  );
}

function Legend() {
  return (
    <div className="space-y-3 text-sm">
      <div className="rounded-lg border border-line bg-panel/80 p-4">
        <div className="mono text-[10.5px] uppercase tracking-[0.14em] text-muted">How to read</div>
        <ul className="mt-2 space-y-1.5 text-muted">
          <li><span className="text-accent">●</span> Category node — counts roll up all descendants.</li>
          <li><span className="text-blue">▸</span> Business node — click for the inspector.</li>
          <li><span className="rounded bg-accent-dim px-1 text-[10px] text-accent">+N</span> added in the last 24 hours.</li>
          <li>Click a count to list that category&apos;s businesses (server-paginated; the graph is never rendered whole).</li>
        </ul>
      </div>
      <div className="rounded-lg border border-line bg-panel/80 p-4">
        <div className="mono text-[10.5px] uppercase tracking-[0.14em] text-muted">Relationships</div>
        <ul className="mt-2 space-y-1 text-muted mono text-xs">
          <li>BUSINESS ─BELONGS_TO→ CATEGORY</li><li>CATEGORY ─SUBCATEGORY_OF→ CATEGORY</li><li>BUSINESS ─LINKS_TO→ BUSINESS</li>
        </ul>
      </div>
    </div>
  );
}
