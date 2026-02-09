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
    staffId?: string | null;
    roles: string[];
  };
};

type ApiResult = {
  ok: boolean;
  status: number;
  bodyText: string;
  bodyJson: any | null;
};

type DoctorOption = {
  id: string;
  firstName: string;
  lastName: string;
};

const BACKEND_BASE =
  (process.env.E2E_BACKEND_URL || "http://localhost:8080/api/v1").replace(/\/?$/, "/");

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

async function apiRequest(
  method: "GET" | "POST" | "PATCH",
  path: string,
  token: string,
  data?: unknown
): Promise<ApiResult> {
  const ctx = await request.newContext({
    baseURL: BACKEND_BASE,
    extraHTTPHeaders: { Authorization: `Bearer ${token}` },
  });

  const normalizedPath = path.replace(/^\/+/, "");
  const res =
    method === "GET"
      ? await ctx.get(normalizedPath)
      : method === "POST"
      ? await ctx.post(normalizedPath, { data })
      : await ctx.patch(normalizedPath, data !== undefined ? { data } : undefined);

  const bodyText = await res.text();
  await ctx.dispose();

  let bodyJson: any | null = null;
  try {
    bodyJson = bodyText ? JSON.parse(bodyText) : null;
  } catch {
    bodyJson = null;
  }

  return {
    ok: res.ok(),
    status: res.status(),
    bodyText,
    bodyJson,
  };
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

async function listActiveDoctors(token: string): Promise<DoctorOption[]> {
  const res = await apiRequest("GET", "staff/doctors/active", token);
  if (!res.ok) {
    throw new Error(`Falha ao listar médicos ativos: ${res.status} ${res.bodyText}`);
  }
  return (res.bodyJson ?? []) as DoctorOption[];
}

async function createPatient(token: string, suffix: string): Promise<{ id: string; patientId: string }> {
  const cpf = suffix.slice(-11).padStart(11, "0");
  const res = await apiRequest("POST", "patients", token, {
    firstName: `E2ECancel${suffix.slice(-4)}`,
    lastName: `Rec${suffix.slice(-5)}`,
    dateOfBirth: "1992-01-01",
    gender: "M",
    motherName: `Mae ${suffix.slice(-5)}`,
    cpf,
  });

  if (!res.ok || !res.bodyJson?.id) {
    throw new Error(`Falha ao criar paciente: ${res.status} ${res.bodyText}`);
  }

  return { id: res.bodyJson.id as string, patientId: res.bodyJson.id as string };
}

async function createAttendance(
  token: string,
  patientId: string,
  doctorId: string
): Promise<{ id: string; status: string }> {
  const res = await apiRequest("POST", "attendances", token, {
    patientId,
    doctorId,
    chiefComplaint: "Dor abdominal moderada.",
    visitType: "URGENCIA",
  });
  if (!res.ok || !res.bodyJson?.id) {
    throw new Error(`Falha ao criar atendimento: ${res.status} ${res.bodyText}`);
  }
  return { id: res.bodyJson.id as string, status: res.bodyJson.status as string };
}

test.describe("Recepção P0 - Cancelamento por estado", () => {
  test.beforeAll(async () => {
    await ensureBackendHealth();
  });

  test("RCP-015: recepção cancela atendimento em CREATED", async () => {
    const recepcao = await loginViaApi(CREDS.recepcao.login, CREDS.recepcao.password);
    const doctors = await listActiveDoctors(recepcao.accessToken);
    expect(doctors.length).toBeGreaterThan(0);

    const suffix = `${Date.now()}1`;
    const patient = await createPatient(recepcao.accessToken, suffix);
    const attendance = await createAttendance(recepcao.accessToken, patient.id, doctors[0].id);
    expect(attendance.status).toBe("CREATED");

    const cancel = await apiRequest("PATCH", `attendances/${attendance.id}/cancel`, recepcao.accessToken);
    expect(cancel.status).toBe(200);
    expect(cancel.bodyJson?.status).toBe("CANCELLED");
  });

  test("RCP-016: recepção cancela atendimento em TRIAGED", async () => {
    const recepcao = await loginViaApi(CREDS.recepcao.login, CREDS.recepcao.password);
    const enfermagem = await loginViaApi(CREDS.enfermagem.login, CREDS.enfermagem.password);
    const doctors = await listActiveDoctors(recepcao.accessToken);
    expect(doctors.length).toBeGreaterThan(0);

    const suffix = `${Date.now()}2`;
    const patient = await createPatient(recepcao.accessToken, suffix);
    const attendance = await createAttendance(recepcao.accessToken, patient.id, doctors[0].id);

    const triageLegacy = await apiRequest("POST", "triages", enfermagem.accessToken, {
      attendanceId: attendance.id,
      patientId: patient.id,
      manchesterClassification: "GREEN",
      chiefComplaint: "Dor leve",
      symptoms: "Sem alarme",
    });
    expect(triageLegacy.status).toBe(201);

    const statusAfterTriage = await apiRequest("GET", `attendances/${attendance.id}`, recepcao.accessToken);
    expect(statusAfterTriage.status).toBe(200);
    expect(statusAfterTriage.bodyJson?.status).toBe("TRIAGED");

    const cancel = await apiRequest("PATCH", `attendances/${attendance.id}/cancel`, recepcao.accessToken);
    expect(cancel.status).toBe(200);
    expect(cancel.bodyJson?.status).toBe("CANCELLED");
  });

  test("RCP-017: recepção não cancela atendimento em IN_PROGRESS", async () => {
    const recepcao = await loginViaApi(CREDS.recepcao.login, CREDS.recepcao.password);
    const enfermagem = await loginViaApi(CREDS.enfermagem.login, CREDS.enfermagem.password);
    const medico = await loginViaApi(CREDS.medico.login, CREDS.medico.password);

    if (!medico.user.staffId) {
      throw new Error("Usuário médico sem staffId, impossível validar fluxo IN_PROGRESS.");
    }

    const suffix = `${Date.now()}3`;
    const patient = await createPatient(recepcao.accessToken, suffix);
    const attendance = await createAttendance(recepcao.accessToken, patient.id, medico.user.staffId);

    const triage = await apiRequest("POST", `triage/visits/${attendance.id}`, enfermagem.accessToken, {
      vitalSigns: {
        bloodPressure: "120/80",
        heartRate: 78,
        respiratoryRate: 18,
        temperature: 36.7,
        oxygenSaturation: 98,
        glasgowComaScale: 15,
      },
      triageColor: "GREEN",
      triageJustification: "Paciente estável sem sinais de gravidade.",
      overrideReason: "Padronização do cenário de teste automatizado.",
    });
    expect(triage.status).toBe(200);

    const start = await apiRequest("POST", `triage/visits/${attendance.id}/start-attendance`, medico.accessToken);
    expect(start.status).toBe(200);
    expect(start.bodyJson?.status).toBe("IN_PROGRESS");

    const cancel = await apiRequest("PATCH", `attendances/${attendance.id}/cancel`, recepcao.accessToken);
    expect(cancel.status).toBe(400);
    expect(cancel.bodyJson?.code).toBe("ILLEGAL_STATE");

    const current = await apiRequest("GET", `attendances/${attendance.id}`, recepcao.accessToken);
    expect(current.status).toBe(200);
    expect(current.bodyJson?.status).toBe("IN_PROGRESS");
  });
});
