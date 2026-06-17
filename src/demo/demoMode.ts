const DEMO_QUERY_VALUES = new Set(["1", "true", "yes", "on"]);
const DEMO_DISABLED_QUERY_VALUES = new Set(["0", "false", "no", "off"]);
const DEMO_MODE_STORAGE_KEY = "amazhealth.demoMode";

function readDemoSearchParam(): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("demo");
}

function readDemoEnvFlag(): string | undefined {
  return import.meta.env.VITE_DEMO_MODE;
}

function readStoredDemoFlag(): string | null {
  if (typeof window === "undefined") return null;

  return window.sessionStorage.getItem(DEMO_MODE_STORAGE_KEY);
}

export function isDemoMode(): boolean {
  const queryValue = readDemoSearchParam();
  const normalizedQueryValue = queryValue?.toLowerCase();

  if (normalizedQueryValue && DEMO_QUERY_VALUES.has(normalizedQueryValue)) {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(DEMO_MODE_STORAGE_KEY, "1");
    }

    return true;
  }

  if (normalizedQueryValue && DEMO_DISABLED_QUERY_VALUES.has(normalizedQueryValue)) {
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(DEMO_MODE_STORAGE_KEY);
    }

    return false;
  }

  const envValue = readDemoEnvFlag();
  if (typeof envValue === "string" && DEMO_QUERY_VALUES.has(envValue.toLowerCase())) {
    return true;
  }

  const storedValue = readStoredDemoFlag();
  return typeof storedValue === "string" && DEMO_QUERY_VALUES.has(storedValue.toLowerCase());
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
