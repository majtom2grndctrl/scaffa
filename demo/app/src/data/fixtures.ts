export type KpiMetric = {
  label: string;
  value: string;
  delta: string;
  tone: "positive" | "warning" | "neutral";
};

export type DriftSignal = {
  id: string;
  label: string;
  detail: string;
  owner: string;
  status: "watch" | "warning" | "critical";
  trend: string;
};

export type ModelSummary = {
  id: string;
  name: string;
  owner: string;
  stage: string;
  status: "healthy" | "watch" | "critical";
  latencyP95: number;
  driftScore: number;
  costPer1k: number;
  version: string;
  lastUpdated: string;
  tags: string[];
};

export type Incident = {
  id: string;
  title: string;
  severity: "low" | "medium" | "high";
  status: "investigating" | "mitigated" | "resolved";
  opened: string;
  impactedModels: string[];
};

export type Experiment = {
  id: string;
  name: string;
  owner: string;
  kind: string;
  status: "running" | "paused" | "completed";
  coverage: number;
  goal: string;
  started: string;
};

export const kpiMetrics: KpiMetric[] = [
  {
    label: "Active Models",
    value: "24",
    delta: "+2 this week",
    tone: "positive",
  },
  {
    label: "Global p95 Latency",
    value: "168ms",
    delta: "+12ms last 6h",
    tone: "warning",
  },
  {
    label: "Quality SLA",
    value: "98.4%",
    delta: "Stable",
    tone: "positive",
  },
  {
    label: "Drift Events",
    value: "3",
    delta: "1 escalated",
    tone: "warning",
  },
];

export const driftSignals: DriftSignal[] = [
  {
    id: "signal-latency-east",
    label: "Latency spike in us-east",
    detail: "p95 +22ms from baseline",
    owner: "Realtime routing",
    status: "warning",
    trend: "Up 14% in 3h",
  },
  {
    id: "signal-drift-retail",
    label: "Concept drift: retail catalog",
    detail: "Feature shift on SKU embeddings",
    owner: "Catalog intelligence",
    status: "critical",
    trend: "New drift segment detected",
  },
  {
    id: "signal-coverage",
    label: "Low coverage: voice intents",
    detail: "Coverage dipped below 93%",
    owner: "Intent classifier",
    status: "watch",
    trend: "Down 3.1% week-over-week",
  },
];

export const modelFleet: ModelSummary[] = [
  {
    id: "atlas-vision",
    name: "Atlas Vision",
    owner: "Retail Ops",
    stage: "Production",
    status: "healthy",
    latencyP95: 152,
    driftScore: 0.12,
    costPer1k: 0.38,
    version: "v3.8.2",
    lastUpdated: "48m ago",
    tags: ["vision", "multi-modal", "edge"],
  },
  {
    id: "nova-rank",
    name: "NovaRank",
    owner: "Search",
    stage: "Production",
    status: "watch",
    latencyP95: 184,
    driftScore: 0.28,
    costPer1k: 0.21,
    version: "v5.1.0",
    lastUpdated: "2h ago",
    tags: ["ranking", "retrieval"],
  },
  {
    id: "pioneer-recsys",
    name: "Pioneer RecSys",
    owner: "Growth",
    stage: "Canary",
    status: "critical",
    latencyP95: 212,
    driftScore: 0.41,
    costPer1k: 0.46,
    version: "v2.3.4",
    lastUpdated: "12m ago",
    tags: ["recommendation", "personalization"],
  },
  {
    id: "helios-guard",
    name: "Helios Guard",
    owner: "Trust & Safety",
    stage: "Production",
    status: "healthy",
    latencyP95: 124,
    driftScore: 0.07,
    costPer1k: 0.19,
    version: "v4.2.1",
    lastUpdated: "1h ago",
    tags: ["policy", "moderation"],
  },
];

export const incidents: Incident[] = [
  {
    id: "inc-0824",
    title: "Fidelity drop on Atlas Vision",
    severity: "high",
    status: "investigating",
    opened: "35m ago",
    impactedModels: ["Atlas Vision", "NovaRank"],
  },
  {
    id: "inc-0817",
    title: "GPU saturation in us-central",
    severity: "medium",
    status: "mitigated",
    opened: "6h ago",
    impactedModels: ["Pioneer RecSys"],
  },
  {
    id: "inc-0809",
    title: "Stale embeddings in checkout",
    severity: "low",
    status: "resolved",
    opened: "2d ago",
    impactedModels: ["Helios Guard"],
  },
];

export const experiments: Experiment[] = [
  {
    id: "exp-91",
    name: "Canary: NovaRank latency trim",
    owner: "Search",
    kind: "Canary",
    status: "running",
    coverage: 42,
    goal: "Reduce p95 below 170ms",
    started: "3h ago",
  },
  {
    id: "exp-87",
    name: "Atlas Vision v3.9 rollout",
    owner: "Retail Ops",
    kind: "Ramp",
    status: "paused",
    coverage: 18,
    goal: "Improve SKU recognition by 1.5%",
    started: "1d ago",
  },
  {
    id: "exp-80",
    name: "Helios Guard policy refresh",
    owner: "Trust & Safety",
    kind: "A/B",
    status: "completed",
    coverage: 100,
    goal: "Reduce false positives",
    started: "6d ago",
  },
];

export const modelDetailNotes: Record<
  string,
  {
    description: string;
    coverage: string;
    guardrails: string[];
    lastRetrain: string;
    owners: string[];
    versions: string[];
  }
> = {
  "atlas-vision": {
    description: "Real-time product vision for shelf state and pricing cues.",
    coverage: "52 regions, 11k active endpoints",
    guardrails: ["PII scrubber", "SKU whitelist", "Edge cache"],
    lastRetrain: "12 days ago",
    owners: ["Retail Ops", "Edge Intelligence"],
    versions: ["v3.8.2 (live)", "v3.7.9", "v3.7.1"],
  },
  "nova-rank": {
    description: "Ranking model for search + browse intent blending.",
    coverage: "94% of web traffic",
    guardrails: ["Diversity cap", "Latency limiter", "Budget guard"],
    lastRetrain: "6 days ago",
    owners: ["Search", "Relevance"],
    versions: ["v5.1.0 (live)", "v5.0.2", "v4.9.8"],
  },
  "pioneer-recsys": {
    description: "Realtime personalization for home feed and upsell.",
    coverage: "18% canary traffic",
    guardrails: ["Bias monitor", "Content throttler"],
    lastRetrain: "19 days ago",
    owners: ["Growth", "Lifecycle"],
    versions: ["v2.3.4 (canary)", "v2.2.9"],
  },
  "helios-guard": {
    description: "Policy compliance for LLM responses and moderation.",
    coverage: "All enterprise traffic",
    guardrails: ["Toxicity filter", "Jailbreak shield", "Audit logger"],
    lastRetrain: "3 days ago",
    owners: ["Trust & Safety"],
    versions: ["v4.2.1 (live)", "v4.1.4", "v4.0.8"],
  },
};
