import { test, expect, request, type Browser, type Page } from "@playwright/test";

type AuthResponse = {
  accessToken: string;
  refreshToken: string | null;
  user: {
    id: string;
    username: string;
    email: string;
    fullName?: string;
    organizationId: string;
    organizationName: string;
    staffId?: string | null;
    activeSectorId?: string | null;
    roles: string[];
  };
};

const BACKEND_BASE =
  (process.env.E2E_BACKEND_URL || "http://localhost:8080/api/v1").replace(/\/?$/, "/");
const FRONTEND_URL = process.env.E2E_FRONTEND_URL || "http://localhost:5173";
const FRONTEND_ORIGIN = new URL(FRONTEND_URL).origin;

const CREDS = {
  superadmin: {
    login: process.env.E2E_ADMIN_LOGIN || "superadmin",
    password: process.env.E2E_ADMIN_PASSWORD || "TroqueEstaSenha123!",
  },
  medico: {
    login: process.env.E2E_DOCTOR_LOGIN || "medico",
    password: process.env.E2E_DOCTOR_PASSWORD || "Medico123!",
  },
} as const;

const VIEWPORTS = [
  { name: "mobile-360", width: 360, height: 800 },
  { name: "tablet-768", width: 768, height: 1024 },
  { name: "desktop-1366", width: 1366, height: 900 },
] as const;

const ADMIN_ROUTES = [
  "/",
  "/hospital",
  "/patients",
  "/appointments",
  "/consultations",
  "/medical-records",
  "/triage",
  "/reception/triage",
  "/admissions",
  "/laboratory",
  "/pharmacy",
  "/billing",
  "/reports",
  "/staff",
  "/users",
];

const DOCTOR_ROUTES = ["/triage", "/consultations", "/medical-records"];

async function loginViaApi(login: string, password: string): Promise<AuthResponse> {
  const ctx = await request.newContext({ baseURL: BACKEND_BASE });
  const res = await ctx.post("auth/login", { data: { login, password } });
  const body = await res.text();
  await ctx.dispose();

  if (!res.ok()) {
    throw new Error(`Falha no login via API (${login}): ${res.status()} ${body}`);
  }

  return JSON.parse(body) as AuthResponse;
}

async function ensureBackendHealth() {
  const ctx = await request.newContext({ baseURL: BACKEND_BASE });
  const res = await ctx.get("status");
  const body = await res.text();
  await ctx.dispose();
  if (!res.ok()) {
    throw new Error(`Backend indisponível para e2e: ${res.status()} ${body}`);
  }
}

function storageStateFor(auth: AuthResponse) {
  const entries = [
    { name: "accessToken", value: auth.accessToken },
    ...(auth.refreshToken ? [{ name: "refreshToken", value: auth.refreshToken }] : []),
    { name: "user", value: JSON.stringify(auth.user) },
  ];

  return {
    cookies: [],
    origins: [{ origin: FRONTEND_ORIGIN, localStorage: entries }],
  };
}

async function openAuthenticatedPage(
  browser: Browser,
  credentials: { login: string; password: string }
): Promise<{ page: Page; close: () => Promise<void> }> {
  const auth = await loginViaApi(credentials.login, credentials.password);
  const context = await browser.newContext({ storageState: storageStateFor(auth) });
  const page = await context.newPage();
  return {
    page,
    close: async () => {
      await context.close();
    },
  };
}

type OverflowAudit = {
  viewportWidth: number;
  documentScrollWidth: number;
  overflowPx: number;
  offenders: Array<{ tag: string; className: string; right: number; width: number }>;
};

async function assertNoHorizontalOverflow(page: Page, route: string, viewportName: string) {
  const audit = await page.evaluate<OverflowAudit>(() => {
    const viewportWidth = window.innerWidth;
    const documentScrollWidth = Math.max(
      document.documentElement.scrollWidth,
      document.body?.scrollWidth ?? 0
    );
    const overflowPx = documentScrollWidth - viewportWidth;

    const offenders = Array.from(document.querySelectorAll<HTMLElement>("body *"))
      .filter((element) => {
        const style = window.getComputedStyle(element);
        if (style.display === "none" || style.visibility === "hidden") return false;
        if (style.position === "fixed") return false;
        const rect = element.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return false;
        return rect.right > viewportWidth + 1;
      })
      .slice(0, 8)
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          tag: element.tagName.toLowerCase(),
          className: (element.className || "").toString().slice(0, 200),
          right: Number(rect.right.toFixed(2)),
          width: Number(rect.width.toFixed(2)),
        };
      });

    return {
      viewportWidth,
      documentScrollWidth,
      overflowPx,
      offenders,
    };
  });

  expect(
    audit.overflowPx <= 1,
    `Overflow horizontal em ${route} (${viewportName}): viewport=${audit.viewportWidth}, scrollWidth=${audit.documentScrollWidth}, overflow=${audit.overflowPx}px, offenders=${JSON.stringify(audit.offenders)}`
  ).toBeTruthy();
}

async function runResponsiveAudit(
  page: Page,
  routes: string[],
  viewport: { name: string; width: number; height: number }
) {
  await page.setViewportSize({ width: viewport.width, height: viewport.height });
  for (const route of routes) {
    await page.goto(route, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(350);
    await assertNoHorizontalOverflow(page, route, viewport.name);
  }
}

test.describe("Responsividade - sem scroll horizontal", () => {
  test.beforeAll(async () => {
    await ensureBackendHealth();
  });

  test("ADMIN: rotas principais sem overflow horizontal", async ({ browser }) => {
    const { page, close } = await openAuthenticatedPage(browser, CREDS.superadmin);
    try {
      for (const viewport of VIEWPORTS) {
        await runResponsiveAudit(page, ADMIN_ROUTES, viewport);
      }
    } finally {
      await close();
    }
  });

  test("DOCTOR: fluxo clínico sem overflow horizontal", async ({ browser }) => {
    const { page, close } = await openAuthenticatedPage(browser, CREDS.medico);
    try {
      for (const viewport of VIEWPORTS) {
        await runResponsiveAudit(page, DOCTOR_ROUTES, viewport);
      }
    } finally {
      await close();
    }
  });
});
