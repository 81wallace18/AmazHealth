const DEMO_QUERY_VALUES = new Set(["1", "true", "yes", "on"]);

function readDemoSearchParam(): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("demo");
}

function readDemoEnvFlag(): string | undefined {
  return import.meta.env.VITE_DEMO_MODE;
}

export function isDemoMode(): boolean {
  const queryValue = readDemoSearchParam();
  if (queryValue && DEMO_QUERY_VALUES.has(queryValue.toLowerCase())) {
    return true;
  }

  const envValue = readDemoEnvFlag();
  return typeof envValue === "string" && DEMO_QUERY_VALUES.has(envValue.toLowerCase());
}

export function getDemoRunId(): string {
  if (typeof window === "undefined") {
    return "demo";
  }

  const params = new URLSearchParams(window.location.search);
  const explicitRun = params.get("demoRunId");
  if (explicitRun?.trim()) {
    return explicitRun.trim().replace(/[^a-zA-Z0-9-]/g, "").slice(0, 16) || "demo";
  }

  const storageKey = "amazhealth.demoRunId";
  const existing = window.sessionStorage.getItem(storageKey);
  if (existing) return existing;

  const generated = `demo-${Date.now().toString(36)}`;
  window.sessionStorage.setItem(storageKey, generated);
  return generated;
}
