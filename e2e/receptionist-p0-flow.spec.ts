import { test, expect, request } from "@playwright/test";

type AuthResponse = {
  accessToken: string;
  refreshToken: string | null;
  user: {
    id: string;
    username: string;
    email: string;
    organizationId: string;
    organizationName: string;
    roles: string[];
  };
};

type DoctorOption = {
  id: string;
  firstName: string;
  lastName: string;
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
};

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

async function listActiveDoctors(accessToken: string): Promise<DoctorOption[]> {
  const ctx = await request.newContext({
    baseURL: BACKEND_BASE,
    extraHTTPHeaders: { Authorization: `Bearer ${accessToken}` },
  });
  const res = await ctx.get("staff/doctors/active");
  const body = await res.text();
  await ctx.dispose();

  if (!res.ok()) {
    throw new Error(`Falha ao listar médicos ativos: ${res.status()} ${body}`);
  }

  return JSON.parse(body) as DoctorOption[];
}

async function createPatient(accessToken: string, suffix: string): Promise<{ id: string; fullName: string; lastName: string }> {
  const cpf = suffix.slice(-11).padStart(11, "0");
  const firstName = `E2ERec${suffix.slice(-4)}`;
  const lastName = `P0${suffix.slice(-5)}`;

  const ctx = await request.newContext({
    baseURL: BACKEND_BASE,
    extraHTTPHeaders: { Authorization: `Bearer ${accessToken}` },
  });

  const res = await ctx.post("patients", {
    data: {
      firstName,
      lastName,
      dateOfBirth: "1991-01-01",
      gender: "M",
      motherName: `Mae ${suffix.slice(-5)}`,
      cpf,
    },
  });

  const body = await res.text();
  await ctx.dispose();

  if (!res.ok()) {
    throw new Error(`Falha ao criar paciente de teste: ${res.status()} ${body}`);
  }

  const created = JSON.parse(body) as { id: string };
  return {
    id: created.id,
    fullName: `${firstName} ${lastName}`,
    lastName,
  };
}

test.describe("Recepção P0", () => {
  test.beforeAll(async () => {
    await ensureBackendHealth();
  });

  test("RCP-011: recepção cria atendimento pela tela de pacientes", async ({ browser }) => {
    const auth = await loginViaApi(CREDS.recepcao.login, CREDS.recepcao.password);
    const doctors = await listActiveDoctors(auth.accessToken);
    if (doctors.length === 0) {
      throw new Error("Nenhum médico ativo encontrado para executar o teste.");
    }

    const suffix = `${Date.now()}`;
    const patient = await createPatient(auth.accessToken, suffix);
    const selectedDoctorLabel = `Dr(a). ${doctors[0].firstName} ${doctors[0].lastName}`;

    const context = await browser.newContext({ storageState: storageStateFor(auth) });
    const page = await context.newPage();

    try {
      await page.goto("/patients");
      await expect(page.getByRole("heading", { name: "Pacientes", exact: true })).toBeVisible();

      await page.getByPlaceholder("Buscar por nome, CPF ou cartão SUS...").fill(patient.lastName);
      const row = page.getByRole("row", { name: new RegExp(patient.fullName, "i") });
      await expect(row).toBeVisible({ timeout: 30_000 });

      await row.getByRole("button", { name: "Iniciar atendimento" }).click();

      const dialog = page.getByRole("dialog", { name: "Iniciar Novo Atendimento" });
      await expect(dialog).toBeVisible();

      await dialog.getByRole("combobox").nth(1).click();
      await page.getByRole("option", { name: selectedDoctorLabel }).click();
      await dialog
        .getByPlaceholder("Ex: Dor abdominal há 2 dias, febre...")
        .fill("Dor lombar intensa há 24 horas.");

      const createAttendanceResponse = page.waitForResponse((res) => {
        return res.request().method() === "POST" && res.url().includes("/api/v1/attendances");
      });

      await dialog.getByRole("button", { name: "Iniciar Atendimento" }).click();
      const res = await createAttendanceResponse;

      if (!res.ok()) {
        const body = await res.text().catch(() => "");
        throw new Error(`Falha ao criar atendimento (HTTP ${res.status()}): ${body}`);
      }

      await expect(dialog).toBeHidden({ timeout: 30_000 });
      await expect(page.getByRole("row", { name: new RegExp(patient.fullName, "i") }).getByText("Atendimento ativo"))
        .toBeVisible({ timeout: 30_000 });
    } finally {
      await context.close();
    }
  });
});
