"use client";
import { useState } from "react";
import { PageHeader } from "@/components/layout/shell";
import { GraphExplorer } from "@/components/graph/explorer";
import { BusinessDrawer } from "@/components/graph/business-drawer";

export default function GraphPage() {
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <div className="flex h-full min-h-0 flex-col">
      <PageHeader title="Graph Explorer" subtitle="Category hierarchy with server-side aggregation. Expand to load deeper levels; nothing is rendered wholesale." />
      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto p-6"><GraphExplorer onSelectBusiness={setSelected} /></div>
      <BusinessDrawer id={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
