export const DIMENSIONS = ["planning", "quality", "pace", "exploration", "steering"] as const;
export type Dimension = (typeof DIMENSIONS)[number];

export const AREAS = ["frontend", "backend", "infra", "data"] as const;
export type Area = (typeof AREAS)[number];

export const TOPICS = [
  "customers",
  "product",
  "sales",
  "marketing",
  "fundraising",
  "finance",
  "hiring",
  "operations",
] as const;
export type Topic = (typeof TOPICS)[number];

export const CONFIDENCE_LEVELS = ["strong", "medium", "weak", "none"] as const;
export type Confidence = (typeof CONFIDENCE_LEVELS)[number];

export const SOURCES = ["git", "claude_code", "codex", "challenge", "chatgpt", "claude_chat"] as const;
export type Source = (typeof SOURCES)[number];

export const AREA_LABELS: Record<Area, string> = {
  frontend: "frontend",
  backend: "backend",
  infra: "infrastructure",
  data: "data",
};

export const DIMENSION_LABELS: Record<Dimension, string> = {
  planning: "Planning",
  quality: "Quality",
  pace: "Pace",
  exploration: "Exploration",
  steering: "Steering",
};

export const TOPIC_LABELS: Record<Topic, string> = {
  customers: "customers",
  product: "product",
  sales: "sales",
  marketing: "marketing",
  fundraising: "fundraising",
  finance: "finance",
  hiring: "hiring",
  operations: "operations",
};
