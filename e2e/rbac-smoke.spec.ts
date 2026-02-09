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
  recepcao: {
    login: process.env.E2E_RECEPTION_LOGIN || "recepcao",
    password: process.env.E2E_RECEPTION_PASSWORD || "Recepcao123!",
  },
  enfermagem: {
    login: process.env.E2E_NURSE_LOGIN || "enfermagem",
    password: process.env.E2E_NURSE_PASSWORD || "Enfermeiro123!",
  },
  medico: {
    login: process.env.E2E_DOCTOR_LOGIN || "medico",
    password: process.env.E2E_DOCTOR_PASSWORD || "Medico123!",
  },
  superadmin: {
    login: process.env.E2E_ADMIN_LOGIN || "superadmin",
    password: process.env.E2E_ADMIN_PASSWORD || "TroqueEstaSenha123!",
  },
} as const;

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

async function expectLinkVisible(page: Page, label: string) {
  await expect(page.getByRole("link", { name: label, exact: true })).toBeVisible();
}

async function expectLinkHidden(page: Page, label: string) {
  await expect(page.getByRole("link", { name: label, exact: true })).toHaveCount(0);
}

async function expectUnauthorized(page: Page, path: string) {
  await page.goto(path);
  await page.waitForURL("**/unauthorized");
  await expect(page.getByRole("heading", { name: "Acesso Negado" })).toBeVisible();
}

test.describe("RBAC smoke por perfil", () => {
  test.beforeAll(async () => {
    await ensureBackendHealth();
  });

  test("DOCTOR: menu clínico e bloqueio de módulos administrativos", async ({ browser }) => {
    const { page, close } = await openAuthenticatedPage(browser, CREDS.medico);
    try {
      await page.goto("/");
      await page.waitForURL("**/triage");
      await expect(page.getByRole("heading", { name: "Triagem Manchester", exact: true })).toBeVisible();

      await expectLinkVisible(page, "Triagem");
      await expectLinkVisible(page, "Consultas");
      await expectLinkVisible(page, "Prontuários");

      await expectLinkHidden(page, "Farmácia");
      await expectLinkHidden(page, "Faturamento");
      await expectLinkHidden(page, "Equipe");
      await expectLinkHidden(page, "Usuários");
      await expectLinkHidden(page, "Relatórios");
      await expectLinkHidden(page, "Pacientes");
      await expectLinkHidden(page, "Agendamentos");
      await expectLinkHidden(page, "Triagem (Recepção)");
      await expectLinkHidden(page, "Andamento (Recepção)");

      await expectUnauthorized(page, "/billing");
      await expectUnauthorized(page, "/staff");
      await expectUnauthorized(page, "/users");
      await expectUnauthorized(page, "/hospital");
    } finally {
      await close();
    }
  });

  test("NURSE: triagem ativa e sem acesso gerencial", async ({ browser }) => {
    const { page, close } = await openAuthenticatedPage(browser, CREDS.enfermagem);
    try {
      await page.goto("/triage");
      await expect(page.getByRole("heading", { name: "Triagem Manchester", exact: true })).toBeVisible();
      await expectLinkVisible(page, "Triagem");

      await expectLinkHidden(page, "Farmácia");
      await expectLinkHidden(page, "Faturamento");
      await expectLinkHidden(page, "Equipe");
      await expectLinkHidden(page, "Usuários");
      await expectLinkHidden(page, "Pacientes");
      await expectLinkHidden(page, "Agendamentos");
      await expectLinkHidden(page, "Triagem (Recepção)");
      await expectLinkHidden(page, "Andamento (Recepção)");

      await expectUnauthorized(page, "/users");
      await expectUnauthorized(page, "/consultations");
      await expectUnauthorized(page, "/appointments");
      await expectUnauthorized(page, "/hospital");
    } finally {
      await close();
    }
  });

  test("RECEPTIONIST: fluxo operacional e sem ação clínica", async ({ browser }) => {
    const { page, close } = await openAuthenticatedPage(browser, CREDS.recepcao);
    try {
      await page.goto("/patients");
      await expect(page.getByRole("heading", { name: "Pacientes", exact: true })).toBeVisible();

      await expectLinkVisible(page, "Pacientes");
      await expectLinkVisible(page, "Agendamentos");
      await expectLinkVisible(page, "Triagem (Recepção)");
      await expectLinkVisible(page, "Andamento (Recepção)");

      await expectLinkHidden(page, "Consultas");
      await expectLinkHidden(page, "Prontuários");
      await expectLinkHidden(page, "Triagem");
      await expectLinkHidden(page, "Farmácia");
      await expectLinkHidden(page, "Faturamento");
      await expectLinkHidden(page, "Equipe");
      await expectLinkHidden(page, "Usuários");

      await expectUnauthorized(page, "/consultations");
      await expectUnauthorized(page, "/medical-records");
      await expectUnauthorized(page, "/triage");
      await expectUnauthorized(page, "/hospital");
    } finally {
      await close();
    }
  });

  test("ADMIN: acesso dashboard + assinatura de versão", async ({ browser }) => {
    const { page, close } = await openAuthenticatedPage(browser, CREDS.superadmin);
    try {
      await page.goto("/");
      await expect(page.getByRole("heading", { name: "Dashboard", exact: true })).toBeVisible();
      await expect(page.getByText("Assinatura de Versão", { exact: true })).toBeVisible();

      await expectLinkVisible(page, "Usuários");
      await expectLinkVisible(page, "Farmácia");
      await expectLinkVisible(page, "Faturamento");
      await expectLinkVisible(page, "Equipe");

      await page.goto("/users");
      await expect(page).not.toHaveURL(/\/unauthorized$/);
    } finally {
      await close();
    }
  });
});
