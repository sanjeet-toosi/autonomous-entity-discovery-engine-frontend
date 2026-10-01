"use client";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { api } from "@/lib/api";
import { fmtNum, fmtDate } from "@/lib/utils";
import { PageHeader } from "@/components/layout/shell";
import { Badge, Empty, Input, Table, statusTone } from "@/components/ui/primitives";

export default function CategoriesPage() {
  const [q, setQ] = useState("");
  const list = useQuery({ queryKey: ["categories", q], queryFn: () => api.categories(q || undefined), refetchInterval: 15000 });
  return (
    <div className="flex h-full min-h-0 flex-col">
      <PageHeader title="Categories" subtitle="The taxonomy the agent has built. Counts shown here are direct members; open a category for roll-ups." />
      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto space-y-3 p-6">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter categories…" className="max-w-xs" />
        <div className="rounded-lg border border-line bg-panel/80">
          {list.data?.length === 0 ? <Empty>No categories yet.</Empty> : (
            <Table head={<><th>Category</th><th>Path</th><th>Depth</th><th>Direct businesses</th><th>Status</th><th>Created</th></>}>
              {(list.data ?? []).map((c: any) => (
                <tr key={c.id}><td><Link href={`/categories/${c.id}`} className="font-medium hover:underline" style={{ paddingLeft: (c.depth - 1) * 14 }}>{c.name}</Link></td><td className="mono text-xs text-dim">{c.path}</td><td className="tabular">{c.depth}</td><td className="tabular">{fmtNum(c.business_count)}</td><td><Badge tone={statusTone(c.status)}>{c.status}</Badge></td><td className="text-dim">{fmtDate(c.created_at)}</td></tr>
              ))}
            </Table>
          )}
        </div>
      </div>
    </div>
  );
}
