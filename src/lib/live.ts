"use client";
/** Live event stream: REST snapshot on load, WebSocket for deltas, reconnect with snapshot reload. */
import { useEffect, useRef, useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { WS_URL, type ActivityEvent, type RunSnapshot } from "./api";

export interface LiveState {
  events: ActivityEvent[];
  snapshot: RunSnapshot | null;
  stages: Record<string, { stage: string; worker_id: string; at: string }>;
  connected: boolean;
  runStatus: string | null;
}

const MAX_EVENTS = 400;
const INVALIDATE_ON = new Set(["RUN_STATUS_CHANGED", "BUSINESS_CREATED", "CATEGORY_CREATED", "STRATEGY_PROMOTED", "BRAIN_LESSON_CREATED", "WORKER_STARTED", "WORKER_STOPPED"]);

export function useLive(runId: string | null | undefined, { global = false } = {}): LiveState {
  const qc = useQueryClient();
  const [state, setState] = useState<LiveState>({ events: [], snapshot: null, stages: {}, connected: false, runStatus: null });
  const wsRef = useRef<WebSocket | null>(null);
  const lastInvalidate = useRef(0);

  const handle = useCallback((raw: string) => {
    let ev: ActivityEvent & { run_id: string | null };
    try { ev = JSON.parse(raw); } catch { return; }
    setState((prev) => {
      const next = { ...prev };
      if (ev.event === "METRICS_UPDATED") {
        next.snapshot = ev.payload as RunSnapshot;
        next.runStatus = (ev.payload as RunSnapshot).status;
        return next;
      }
      if (ev.event === "STAGE_CHANGED") {
        const p = ev.payload as { stage: string; domain: string; worker_id: string };
        next.stages = { ...prev.stages, [p.domain]: { stage: p.stage, worker_id: p.worker_id, at: ev.timestamp } };
        return next;
      }
      if (ev.event === "FRONTIER_UPDATED") return prev;
      if (ev.event === "RUN_STATUS_CHANGED") next.runStatus = (ev.payload as { to: string }).to;
      if (ev.event === "DOMAIN_REJECTED" || ev.event === "BUSINESS_CREATED" || ev.event === "DOMAIN_FAILED") {
        const d = ev.domain ?? "";
        if (d && prev.stages[d]) { const s = { ...prev.stages }; delete s[d]; next.stages = s; }
      }
      next.events = [ev, ...prev.events].slice(0, MAX_EVENTS);
      return next;
    });
    if (INVALIDATE_ON.has(ev.event)) {
      const now = Date.now();
      if (now - lastInvalidate.current > 1500) {
        lastInvalidate.current = now;
        qc.invalidateQueries();
      }
    }
  }, [qc]);

  useEffect(() => {
    if (!runId && !global) return;
    let closed = false;
    let retry = 1000;
    const connect = () => {
      const url = global && !runId ? `${WS_URL}/ws/global` : `${WS_URL}/ws/runs/${runId}`;
      const ws = new WebSocket(url);
      wsRef.current = ws;
      ws.onopen = () => { retry = 1000; setState((p) => ({ ...p, connected: true })); qc.invalidateQueries(); };
      ws.onmessage = (m) => handle(m.data);
      ws.onclose = () => {
        setState((p) => ({ ...p, connected: false }));
        if (!closed) { setTimeout(connect, retry); retry = Math.min(retry * 2, 15000); }
      };
      ws.onerror = () => ws.close();
    };
    connect();
    const ping = setInterval(() => { if (wsRef.current?.readyState === WebSocket.OPEN) wsRef.current.send("ping"); }, 25000);
    return () => { closed = true; clearInterval(ping); wsRef.current?.close(); };
  }, [runId, global, handle, qc]);

  return state;
}
