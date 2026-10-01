import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function fmtNum(n: number | null | undefined, compact = false): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  if (compact) {
    if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(n >= 10_000_000 ? 1 : 2) + "M";
    if (Math.abs(n) >= 1_000) return (n / 1_000).toFixed(n >= 100_000 ? 0 : 1) + "K";
  }
  return new Intl.NumberFormat("en-US").format(Math.round(n));
}

export function fmtPct(n: number | null | undefined, digits = 0): string {
  if (n === null || n === undefined) return "—";
  return (n * 100).toFixed(digits) + "%";
}

export function fmtDuration(seconds: number | null | undefined): string {
  if (!seconds && seconds !== 0) return "—";
  const s = Math.floor(seconds);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d > 0) return `${d.toString().padStart(2, "0")}d ${h.toString().padStart(2, "0")}h ${m.toString().padStart(2, "0")}m`;
  if (h > 0) return `${h.toString().padStart(2, "0")}h ${m.toString().padStart(2, "0")}m ${sec.toString().padStart(2, "0")}s`;
  return `${m.toString().padStart(2, "0")}m ${sec.toString().padStart(2, "0")}s`;
}

export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return "—";
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 5) return "just now";
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function fmtTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-GB", { hour12: false });
}

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
