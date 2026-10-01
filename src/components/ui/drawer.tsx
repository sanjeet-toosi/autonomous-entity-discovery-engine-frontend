"use client";
import { X } from "lucide-react";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

export function Drawer({ open, onClose, title, children, width = "max-w-2xl" }: { open: boolean; onClose: () => void; title?: React.ReactNode; children: React.ReactNode; width?: string }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" onClick={onClose} />
      <aside className={cn("relative flex h-full w-full flex-col border-l border-line bg-elev shadow-2xl", width)}>
        <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div className="min-w-0">{title}</div>
          <button onClick={onClose} className="rounded-md p-1 text-muted hover:bg-panel hover:text-fg"><X size={18} /></button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
      </aside>
    </div>
  );
}
