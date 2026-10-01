/** Typed client for the business-graph-backend control plane. */
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8010";
export const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? API_URL.replace(/^http/, "ws");

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}/api/v1${path}`, {
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
    cache: "no-store",
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail ?? JSON.stringify(body);
    } catch {}
    throw new Error(detail);
  }
  return res.json() as Promise<T>;
}

const qs = (params: Record<string, unknown>) => {
  const u = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") u.set(k, String(v));
  });
  const s = u.toString();
  return s ? `?${s}` : "";
};

// ---- types --------------------------------------------------------------------------
export type RunStatus = "DRAFT" | "STARTING" | "RUNNING" | "PAUSING" | "PAUSED" | "RESUMING" | "STOPPING" | "STOPPED" | "COMPLETED" | "FAILED";

export interface Mission {
  id: string; name: string; prompt: string; status: string; interpretation: Record<string, any>;
  created_at: string; updated_at: string; active_run_id: string | null; active_run_status: RunStatus | null;
}
export interface RunSnapshot {
  run_id: string; status: RunStatus; runtime_seconds: number; strategy_version: string | null;
  frontier: { queued: number; processing: number; processed: number; rejected: number; failed: number; total: number };
  totals: { businesses: number; categories: number; edges: number; candidates: number };
  metrics: Record<string, number>;
  processing: { domain: string; worker: string | null; claimed_at: string | null; source: string; priority: number }[];
  cursor_state: Record<string, any>;
}
export interface Run {
  id: string; mission_id: string; mission_prompt: string | null; mission_name: string | null; status: RunStatus; strategy_version: string | null;
  started_at: string | null; ended_at: string | null; runtime_seconds: number; created_at: string; config: Record<string, any>;
  parent_run_id: string | null; checkpoint_id: string | null; error: string | null;
  stats?: { businesses: number; domains_crawled: number; candidates: number; queued: number; errors: number };
  snapshot?: RunSnapshot;
}
export interface StatsOverview {
  range: string; scope: string;
  cards: Record<"businesses" | "categories" | "edges" | "candidates", { total: number; change: number }>;
  metrics: Record<string, number>;
  frontier: Record<string, number>;
}
export interface ActivityEvent {
  id?: number; event: string; category: string; level: string; domain: string | null; message: string; worker_id: string | null;
  run_id: string | null; payload: Record<string, any>; timestamp: string;
}
export interface CategoryNode {
  id: string; slug: string; name: string; path: string; depth: number; business_count: number; added_24h: number; subcategory_count: number;
  confidence: number; created_at: string;
}
export interface Business {
  id: string; domain: string; name: string | null; country_code: string | null; region: string | null; city: string | null; confidence: number;
  status: string; business_type: string; primary_category_id: string | null; first_seen_at: string; last_verified_at: string | null; created_at: string;
  primary_category?: { id: string; name: string; path: string } | null;
  description?: string | null; registrable_domain?: string; source_type?: string | null; source_reference?: string | null; metadata?: Record<string, any>;
  categories?: { id: string; name: string; slug: string; depth: number }[]; discovered_by_run_id?: string | null; last_seen_at?: string; updated_at?: string;
}
export interface Integration {
  key: string; label: string; kind: "free" | "paid_api" | "registry"; description: string; docs_url: string | null; requires_key: boolean;
  config_fields: { key: string; label: string; type: "number" | "boolean" | "string"; default: unknown }[];
  enabled: boolean; usable: boolean; has_key: boolean; api_key_masked: string | null; config: Record<string, unknown>;
  status: { last_test?: { ok: boolean; message: string; tested_at: string } };
}
export interface SourceCursor { index?: number; queries?: number; hits?: number; added?: number; errors?: number; done?: boolean; stopped_reason?: string; next_at?: string; requests?: number; extra?: unknown[] }

export interface WorkerInfo {
  worker_id: string; worker_type: string; status: string; hostname: string | null; pid: number | null; current_job: Record<string, any> | null;
  jobs_completed: number; jobs_failed: number; started_at: string; last_heartbeat: string;
}

// ---- endpoints ----------------------------------------------------------------------
export const api = {
  interpret: (prompt: string) => request<{ interpretation: Record<string, any>; provider: string; model: string }>("/missions/interpret", { method: "POST", body: JSON.stringify({ prompt }) }),
  createMission: (prompt: string, start = true) => request<Mission>("/missions", { method: "POST", body: JSON.stringify({ prompt, start }) }),
  missions: () => request<Mission[]>("/missions"),
  mission: (id: string) => request<Mission>(`/missions/${id}`),
  startRun: (missionId: string) => request<{ id: string; status: RunStatus }>(`/missions/${missionId}/runs`, { method: "POST" }),

  runs: (params: { mission_id?: string; limit?: number } = {}) => request<Run[]>(`/runs${qs(params)}`),
  run: (id: string) => request<Run>(`/runs/${id}`),
  runStatus: (id: string) => request<RunSnapshot>(`/runs/${id}/status`),
  runCheckpoints: (id: string) => request<any[]>(`/runs/${id}/checkpoints`),
  runErrors: (id: string) => request<any[]>(`/runs/${id}/errors`),
  pause: (id: string) => request<{ status: RunStatus }>(`/runs/${id}/pause`, { method: "POST" }),
  resume: (id: string) => request<{ status: RunStatus }>(`/runs/${id}/resume`, { method: "POST" }),
  stop: (id: string) => request<{ status: RunStatus }>(`/runs/${id}/stop`, { method: "POST" }),
  continueRun: (id: string) => request<{ id: string; status: RunStatus }>(`/runs/${id}/continue`, { method: "POST" }),

  stats: (params: { range?: string; mission_id?: string; run_id?: string } = {}) => request<StatsOverview>(`/stats/overview${qs(params)}`),
  series: (metric: string, hours = 24, run_id?: string) => request<{ points: { bucket: string; value: number }[] }>(`/stats/series${qs({ metric, hours, run_id })}`),
  changes: (hours = 24, run_id?: string) => request<{ counts: Record<string, number> }>(`/stats/changes${qs({ hours, run_id })}`),

  activity: (params: { run_id?: string; category?: string; domain?: string; before_id?: number; limit?: number } = {}) => request<ActivityEvent[]>(`/activity${qs(params)}`),
  changeEvents: (params: { run_id?: string; event_type?: string; limit?: number } = {}) => request<any[]>(`/activity/changes${qs(params)}`),

  graphRoot: (params: Record<string, unknown> = {}) => request<{ root: { id: string | null; name: string; business_count: number }; children: CategoryNode[] }>(`/graph/root${qs(params)}`),
  graphChildren: (id: string, params: Record<string, unknown> = {}) => request<CategoryNode[]>(`/graph/categories/${id}/children${qs(params)}`),
  graphBusinesses: (id: string, params: Record<string, unknown> = {}) => request<{ items: Business[]; next_cursor: string | null }>(`/graph/categories/${id}/businesses${qs(params)}`),
  graphSearch: (q: string) => request<{ categories: { id: string; name: string; path: string; depth: number }[]; businesses: Business[] }>(`/graph/search${qs({ q })}`),
  neighborhood: (domain: string) => request<{ nodes: { id: string; label: string; type: string }[]; edges: { source: string; target: string; type: string }[] }>(`/graph/neighborhood/${encodeURIComponent(domain)}`),

  businesses: (params: Record<string, unknown> = {}) => request<{ items: Business[]; total: number; limit: number; offset: number }>(`/businesses${qs(params)}`),
  business: (id: string) => request<Business>(`/businesses/${id}`),
  businessEvidence: (id: string) => request<any[]>(`/businesses/${id}/evidence`),
  businessHistory: (id: string) => request<any[]>(`/businesses/${id}/history`),
  businessRelationships: (id: string) => request<any[]>(`/businesses/${id}/relationships`),
  businessPages: (id: string) => request<any[]>(`/businesses/${id}/pages`),
  businessActivity: (id: string) => request<any[]>(`/businesses/${id}/activity`),
  businessDiscoveries: (id: string) => request<any[]>(`/businesses/${id}/discoveries`),

  categories: (q?: string) => request<any[]>(`/categories${qs({ q })}`),
  category: (id: string) => request<any>(`/categories/${id}`),

  brainOverview: () => request<any>("/brain/overview"),
  brainMemories: () => request<any[]>("/brain/memories"),
  brainLessons: (status?: string) => request<any[]>(`/brain/lessons${qs({ status })}`),
  setLessonStatus: (id: string, status: string) => request<any>(`/brain/lessons/${id}/status${qs({ status })}`, { method: "POST" }),
  brainStrategies: () => request<any[]>("/brain/strategies"),
  promoteStrategy: (id: string) => request<any>(`/brain/strategies/versions/${id}/promote`, { method: "POST" }),
  rejectStrategy: (id: string) => request<any>(`/brain/strategies/versions/${id}/reject`, { method: "POST" }),
  brainSources: (params: { vertical?: string; order?: string; limit?: number } = {}) => request<any[]>(`/brain/sources${qs(params)}`),
  brainFailures: () => request<{ summary: any[]; recent: any[] }>("/brain/failures"),
  brainExperiments: () => request<any[]>("/brain/experiments"),
  brainExperiences: (limit = 50) => request<any[]>(`/brain/experiences${qs({ limit })}`),
  reflect: (missionId: string) => request<any>(`/brain/reflect${qs({ mission_id: missionId })}`, { method: "POST" }),

  integrations: () => request<Integration[]>("/integrations"),
  updateIntegration: (key: string, body: { enabled?: boolean; api_key?: string; clear_key?: boolean; config?: Record<string, unknown> }) =>
    request<Integration>(`/integrations/${key}`, { method: "PUT", body: JSON.stringify(body) }),
  testIntegration: (key: string) => request<{ ok: boolean; message: string; tested_at: string }>(`/integrations/${key}/test`, { method: "POST" }),

  health: () => request<any>("/system/health"),
  workers: () => request<{ summary: Record<string, { healthy: number; total: number }>; workers: WorkerInfo[] }>("/system/workers"),
  queues: () => request<any>("/system/queues"),
  systemErrors: () => request<any[]>("/system/errors"),
  systemConfig: () => request<any>("/system/config"),
};
