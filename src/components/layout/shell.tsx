"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Brain, Building2, Cpu, GitFork, LayoutDashboard, ListTree, Plug, Radio } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { StatusDot } from "@/components/ui/primitives";

const NAV = [
  { href: "/", label: "Control Center", icon: LayoutDashboard },
  { href: "/runs", label: "Runs", icon: Radio },
  { href: "/graph", label: "Graph", icon: GitFork },
  { href: "/businesses", label: "Businesses", icon: Building2 },
  { href: "/categories", label: "Categories", icon: ListTree },
  { href: "/brain", label: "Brain", icon: Brain },
  { href: "/activity", label: "Activity", icon: Activity },
  { href: "/integrations", label: "Sources", icon: Plug },
  { href: "/system", label: "System", icon: Cpu },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const health = useQuery({ queryKey: ["health"], queryFn: api.health, refetchInterval: 10000 });
  const missions = useQuery({ queryKey: ["missions"], queryFn: api.missions, refetchInterval: 8000 });
  const active = missions.data?.find((m) => m.active_run_id);
  const ok = health.data?.postgres && health.data?.redis;
  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <aside className="flex h-full w-56 shrink-0 flex-col overflow-hidden border-r border-line bg-elev/70">
        <div className="flex items-center gap-2.5 px-4 py-4">
          <div className="grid h-8 w-8 place-items-center rounded-md border border-accent/40 bg-accent-dim text-accent"><GitFork size={16} /></div>
          <div>
            <div className="text-sm font-semibold leading-tight">Business Graph</div>
            <div className="mono text-[10px] uppercase tracking-widest text-dim">Control Center</div>
          </div>
        </div>
        <nav className="mt-2 flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-2">
          {NAV.map(({ href, label, icon: Icon }) => {
            const on = href === "/" ? path === "/" : path.startsWith(href);
            return (
              <Link key={href} href={href} className={cn("flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors", on ? "bg-panel text-fg" : "text-muted hover:bg-panel/60 hover:text-fg")}>
                <Icon size={15} className={cn(on ? "text-accent" : "text-dim")} />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-line px-4 py-3 text-xs">
          {active ? (
            <Link href={`/runs/${active.active_run_id}`} className="block rounded-md border border-line bg-panel p-2.5 hover:border-line-strong">
              <div className="flex items-center gap-2"><StatusDot status={active.active_run_status ?? ""} /><span className="mono text-[10px] uppercase tracking-wider text-muted">{active.active_run_status}</span></div>
              <div className="mt-1 truncate text-fg">{active.prompt}</div>
            </Link>
          ) : (
            <div className="text-dim">No active run</div>
          )}
          <div className="mt-3 flex items-center gap-2 text-dim">
            <StatusDot status={ok ? "HEALTHY" : "UNHEALTHY"} />
            <span className="mono text-[10px] uppercase tracking-wider">{ok ? "backend online" : health.isError ? "backend offline" : "connecting"}</span>
          </div>
        </div>
      </aside>
      <main className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">{children}</main>
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex shrink-0 flex-wrap items-end justify-between gap-4 border-b border-line bg-bg px-6 py-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
