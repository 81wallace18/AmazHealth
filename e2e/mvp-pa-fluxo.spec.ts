import { test, expect, request, type Page } from '@playwright/test';

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
  (process.env.E2E_BACKEND_URL || 'http://localhost:8080/api/v1').replace(/\/?$/, '/') /* ensure trailing slash */;
const FRONTEND_URL = process.env.E2E_FRONTEND_URL || 'http://localhost:5173';
const FRONTEND_ORIGIN = new URL(FRONTEND_URL).origin;

const CREDS = {
  recepcao: { login: 'recepcao', password: 'Recepcao123!' },
  enfermagem: { login: 'enfermagem', password: 'Enfermeiro123!' },
  medico: { login: 'medico', password: 'Medico123!' },
  farmacia: { login: 'farmacia', password: 'Farmacia123!' },
  superadmin: { login: 'superadmin', password: 'TroqueEstaSenha123!' },
} as const;

async function loginViaApi(login: string, password: string): Promise<AuthResponse> {
  const ctx = await request.newContext({ baseURL: BACKEND_BASE });
  const res = await ctx.post('auth/login', { data: { login, password } });
  const body = await res.text();
  await ctx.dispose();

  if (!res.ok()) {
    throw new Error(`Falha no login via API (${login}): ${res.status()} ${body}`);
  }

  return JSON.parse(body) as AuthResponse;
}

function storageStateFor(auth: AuthResponse) {
  const entries = [
    { name: 'accessToken', value: auth.accessToken },
    ...(auth.refreshToken ? [{ name: 'refreshToken', value: auth.refreshToken }] : []),
    { name: 'user', value: JSON.stringify(auth.user) },
  ];

  return {
    cookies: [],
    origins: [{ origin: FRONTEND_ORIGIN, localStorage: entries }],
  };
}

async function apiJson<T>(
  method: 'GET' | 'POST',
  path: string,
  opts: { token?: string; data?: unknown; params?: Record<string, string | number> } = {}
): Promise<T> {
  const normalizedPath = path.replace(/^\/+/, '');
  const ctx = await request.newContext({
    baseURL: BACKEND_BASE,
    extraHTTPHeaders: opts.token ? { Authorization: `Bearer ${opts.token}` } : undefined,
  });

  const params = new URLSearchParams();
  if (opts.params) for (const [k, v] of Object.entries(opts.params)) params.set(k, String(v));
  const rel = params.toString() ? `${normalizedPath}?${params.toString()}` : normalizedPath;

  const res =
    method === 'GET'
      ? await ctx.get(rel)
      : await ctx.post(rel, { data: opts.data });

  const text = await res.text();
  await ctx.dispose();

  if (!res.ok()) {
    throw new Error(`Backend ${method} ${path} falhou: ${res.status()} ${text}`);
  }

  return JSON.parse(text) as T;
}

async function ensureBackendHealth() {
  await apiJson('GET', 'status');
}

type Medicine = { id: string; medicineCode: string; medicineName: string };
type StockPage = { content: Array<{ id: string; batchNumber: string; quantityInStock: number; expiryDate?: string }> };
type MedicinePage = { content: Medicine[] };

async function ensureMedicineAndStock(adminToken?: string) {
  const token =
    adminToken ?? (await loginViaApi(CREDS.superadmin.login, CREDS.superadmin.password)).accessToken;

  const code = `E2E-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`;
  const name = `E2E Analgesico ${code}`;

  const search = await apiJson<MedicinePage>('GET', 'pharmacy/medicines/search', {
    token,
    params: { q: code, page: 0, size: 5 },
  });

  const existing = search.content?.[0];
  const medicine =
    existing ??
    (await apiJson<Medicine>('POST', 'pharmacy/medicines', {
      token,
      data: {
        medicineCode: code,
        medicineName: name,
        dosageForm: 'TABLET',
        category: 'ANALGESIC',
        genericName: 'Dipirona',
        strength: '500mg',
        manufacturer: 'E2E',
        unitPrice: 1,
        reorderLevel: 10,
        requiresPrescription: true,
        isActive: true,
      },
    }));

  const stock = await apiJson<StockPage>('GET', `pharmacy/stock/medicine/${medicine.id}`, {
    token,
    params: { page: 0, size: 50 },
  });

  const hasStock = (stock.content ?? []).some((s) => (s.quantityInStock ?? 0) > 0);
  if (!hasStock) {
    const batch = `E2E-BATCH-${Date.now()}`;
    await apiJson('POST', 'pharmacy/stock', {
      token,
      data: {
        medicineId: medicine.id,
        batchNumber: batch,
        quantityInStock: 100,
        expiryDate: '2030-01-01',
        supplier: 'E2E',
        storageLocation: 'E2E',
      },
    });
  }

  return { medicineCode: medicine.medicineCode, medicineName: medicine.medicineName };
}

type Staff = { id: string; firstName: string; lastName: string };

async function resolveDoctorOptionLabelForUser(login: string, password: string, adminToken?: string) {
  const auth = await loginViaApi(login, password);
  const staffId = auth.user.staffId;
  if (!staffId) {
    throw new Error(`Usuario ${login} nao possui staffId (necessario para alocar atendimento).`);
  }
  // Acesso ao endpoint /staff/{id} pode ser bloqueado por RBAC para alguns perfis.
  // Então usamos um token de admin (superadmin) só para resolver o nome do profissional.
  const token =
    adminToken ||
    (process.env.E2E_ADMIN_TOKEN && process.env.E2E_ADMIN_TOKEN.trim()) ||
    (await loginViaApi(CREDS.superadmin.login, CREDS.superadmin.password)).accessToken;
  const staff = await apiJson<Staff>('GET', `staff/${staffId}`, { token });
  return { staffId, label: `Dr(a). ${staff.firstName} ${staff.lastName}` };
}

async function waitForText(page: Page, text: string, timeoutMs = 60_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await page.getByText(text, { exact: false }).first().isVisible().catch(() => false)) return;
    await page.waitForTimeout(800);
    await page.reload();
  }
  throw new Error(`Timeout aguardando texto na UI: ${text}`);
}

test.describe('MVP - Fluxo Feliz #1 (PA Completo) via UI', () => {
  test('Recepcao -> Enfermagem -> Medico -> Farmacia -> Medico', async ({ browser }) => {
    test.setTimeout(6 * 60 * 1000);

    const adminAuth = await test.step('Sanidade: autenticar superadmin (token reutilizável)', async () => {
      return await loginViaApi(CREDS.superadmin.login, CREDS.superadmin.password);
    });

    const seed = await test.step('Sanidade: backend up + seed (medicamento + estoque)', async () => {
      await ensureBackendHealth();
      return await ensureMedicineAndStock(adminAuth.accessToken);
    });

    const medicoDoctor = await test.step('Sanidade: resolver medico para alocacao de atendimento', async () => {
      return await resolveDoctorOptionLabelForUser(
        CREDS.medico.login,
        CREDS.medico.password,
        adminAuth.accessToken
      );
    });

    const suffix = `${Date.now()}`;
    const patient = {
      firstName: `E2E${suffix.slice(-4)}`,
      lastName: `Paciente${suffix.slice(-6)}`,
      dateOfBirth: '1990-01-01',
      motherName: `Mae ${suffix.slice(-6)}`,
      chiefComplaint: 'Dor abdominal ha 2 dias',
    };
    const patientFullName = `${patient.firstName} ${patient.lastName}`;

    let visitId = '';
    let prescriptionCode = '';

    await test.step('1) Recepcao: cadastrar paciente + criar atendimento', async () => {
      const auth = await loginViaApi(CREDS.recepcao.login, CREDS.recepcao.password);
      const context = await browser.newContext({ storageState: storageStateFor(auth) });
      const page = await context.newPage();

      await page.goto('/patients');
      await expect(page.getByRole('heading', { name: 'Pacientes', exact: true })).toBeVisible();

      await page.getByRole('button', { name: 'Novo Paciente' }).click();
      const dialog = page.getByRole('dialog', { name: 'Novo Paciente' });
      await expect(dialog).toBeVisible();

      await dialog.getByLabel('Nome *', { exact: true }).fill(patient.firstName);
      await dialog.getByLabel('Sobrenome *', { exact: true }).fill(patient.lastName);
      await dialog.getByLabel('Data de Nascimento *', { exact: true }).fill(patient.dateOfBirth);

      // Select de gênero (Radix Select). Nem sempre há "accessible name" no combobox;
      // então clicamos no placeholder visível.
      await dialog.getByText('Selecione o gênero', { exact: true }).click();
      await page.getByRole('option', { name: 'Masculino' }).click();

      await dialog.getByLabel('Nome da Mãe *', { exact: true }).fill(patient.motherName);
      await dialog.getByRole('button', { name: 'Salvar Paciente' }).click();

      await expect(dialog).toBeHidden({ timeout: 30_000 });

      // Filtra a lista para achar o paciente criado.
      await page.getByPlaceholder('Buscar por nome, CPF ou cartão SUS...').fill(patient.lastName);
      const row = page.getByRole('row', { name: new RegExp(patientFullName, 'i') });
      await expect(row).toBeVisible({ timeout: 30_000 });

      // O botão exibe "Atender", mas o accessible name vem do aria-label.
      await row.getByRole('button', { name: 'Iniciar atendimento' }).click();
      const attendanceDialog = page.getByRole('dialog', { name: 'Iniciar Novo Atendimento' });
      await expect(attendanceDialog).toBeVisible();

      const doctorCombo = attendanceDialog.getByRole('combobox').nth(1);
      await doctorCombo.click();
      await expect(page.getByRole('option', { name: medicoDoctor.label })).toBeVisible({ timeout: 10_000 });
      await page.getByRole('option', { name: medicoDoctor.label }).click();

      await attendanceDialog.getByPlaceholder('Ex: Dor abdominal há 2 dias, febre...').fill(patient.chiefComplaint);
      const createAttendanceResponse = page.waitForResponse((res) => {
        return res.request().method() === 'POST' && res.url().includes('/api/v1/attendances');
      });
      await attendanceDialog.getByRole('button', { name: 'Iniciar Atendimento' }).click();
      const createRes = await createAttendanceResponse;
      if (!createRes.ok()) {
        const body = await createRes.text().catch(() => '');
        throw new Error(`Falha ao criar atendimento (HTTP ${createRes.status()}): ${body}`);
      }
      const createdAttendance = (await createRes.json().catch(() => null)) as
        | { id: string; doctorId: string }
        | null;
      if (createdAttendance?.id) visitId = createdAttendance.id;
      if (createdAttendance?.doctorId && createdAttendance.doctorId !== medicoDoctor.staffId) {
        throw new Error(
          `Atendimento criado com medico incorreto. esperado=${medicoDoctor.staffId} recebido=${createdAttendance.doctorId}`
        );
      }

      // Critério: feedback de sucesso do fluxo (toast) e modal fechado.
      await expect(attendanceDialog).toBeHidden({ timeout: 30_000 });

      await context.close();
    });

    await test.step('2) Enfermagem: triagem Manchester (sinais vitais + cor + justificativa)', async () => {
      const auth = await loginViaApi(CREDS.enfermagem.login, CREDS.enfermagem.password);
      const context = await browser.newContext({ storageState: storageStateFor(auth) });
      const page = await context.newPage();

      await page.goto('/triage');
      await expect(page.getByRole('heading', { name: 'Triagem Manchester', exact: true })).toBeVisible();

      // Localiza o item da fila de triagem pelo h4 (heading) e sobe até o container do card.
      const patientHeading = page.getByRole('heading', { name: patientFullName, exact: true });
      await expect(patientHeading).toBeVisible({ timeout: 60_000 });
      const patientRow = patientHeading.locator(
        'xpath=ancestor::div[contains(@class,"justify-between") and contains(@class,"rounded-lg")][1]'
      );
      await patientRow.getByRole('button', { name: 'Iniciar Triagem' }).click();

      const triageDialog = page.getByRole('dialog');
      await expect(triageDialog.getByText(`Triagem Manchester - ${patientFullName}`)).toBeVisible();

      await triageDialog.getByLabel('PA Sistólica (mmHg) *').fill('120');
      await triageDialog.getByLabel('PA Diastólica (mmHg) *').fill('80');
      await triageDialog.getByLabel('Frequência Cardíaca (bpm) *').fill('72');
      await triageDialog.getByLabel('Escala de Coma de Glasgow (3-15) *').fill('15');

      // Força uma cor estável (GREEN) para evitar dependência de sugestão.
      await triageDialog.locator('#color').click();
      await page.getByRole('option', { name: /Pouco Urgente/i }).click();

      await triageDialog.getByLabel('Justificativa *').fill('Paciente estável, sem sinais de alarme.');

      // Se a cor escolhida divergir da sugestão do backend, o sistema exige overrideReason.
      // Esse campo pode aparecer com delay (após a sugestão do backend concluir).
      const overrideReason = triageDialog.locator('#overrideReason');
      try {
        await overrideReason.waitFor({ state: 'visible', timeout: 2000 });
        await overrideReason.fill('Ajuste manual para padronizar o teste E2E.');
      } catch {
        // Sem override necessário (ou sugestão ainda não renderizada) — ok.
      }
      const registerResponse = page.waitForResponse(async (res) => {
        if (res.request().method() !== 'POST') return false;
        const url = res.url();
        if (!url.includes('/api/v1/triage/visits/')) return false;
        // Evita confundir com /suggest, /start-attendance, etc.
        if (url.includes('/suggest') || url.includes('/start-attendance') || url.includes('/reclassify')) return false;
        return true;
      });

      await triageDialog.getByRole('button', { name: 'Registrar Triagem' }).scrollIntoViewIfNeeded();
      await triageDialog.getByRole('button', { name: 'Registrar Triagem' }).click();

      const res = await registerResponse;
      if (!res.ok()) {
        const body = await res.text().catch(() => '');
        throw new Error(`Falha ao registrar triagem (HTTP ${res.status()}): ${body}`);
      }

      await expect(triageDialog).toBeHidden({ timeout: 30_000 });
      await context.close();
    });

    await test.step('3-6) Médico: iniciar atendimento -> prontuário -> prescrição', async () => {
      const auth = await loginViaApi(CREDS.medico.login, CREDS.medico.password);
      const context = await browser.newContext({ storageState: storageStateFor(auth) });
      const page = await context.newPage();

      await page.goto('/triage');
      await expect(page.getByRole('heading', { name: 'Triagem Manchester', exact: true })).toBeVisible();

      // Aguarda o paciente aparecer no board do médico com ação "Iniciar atendimento".
      // Usa o h4 do card do TriageBoard para não confundir com outros lugares da página.
      const patientHeading = page.getByRole('heading', { name: patientFullName, exact: true });
      const card = patientHeading.locator('xpath=ancestor::div[contains(@class,"rounded-xl")][1]');
      const startButton = card.getByRole('button', { name: 'Iniciar atendimento' }).first();

      await expect(startButton).toBeVisible({ timeout: 60_000 });
      const startAttendanceResponse = page.waitForResponse((res) => {
        if (res.request().method() !== 'POST') return false;
        const url = res.url();
        return url.includes('/api/v1/triage/visits/') && url.includes('/start-attendance');
      });

      await startButton.click();
      const startRes = await startAttendanceResponse;
      if (!startRes.ok()) {
        const body = await startRes.text().catch(() => '');
        throw new Error(`Falha ao iniciar atendimento (HTTP ${startRes.status()}): ${body}`);
      }

      // Extrai visitId da URL do request (fonte de verdade).
      const m = startRes.url().match(/\/api\/v1\/triage\/visits\/([^/]+)\/start-attendance/);
      if (m?.[1]) visitId = m[1];

      await expect(page).toHaveURL(/\/medical-records\?visitId=/, { timeout: 30_000 });
      const url = new URL(page.url());
      visitId = url.searchParams.get('visitId') || visitId;
      expect(visitId, 'visitId deve existir na URL').toBeTruthy();

      await expect(page.getByRole('heading', { name: 'Atendimento' })).toBeVisible();

      // Prontuário: cria um registro mínimo (notes obrigatório)
      await page.getByRole('button', { name: 'Novo Prontuário' }).click();
      const recordDialog = page.getByRole('dialog');
      await expect(recordDialog.getByText('Novo Prontuário')).toBeVisible();
      await recordDialog.locator('textarea[required]').fill('E2E: registro de evolução.');
      await recordDialog.getByRole('button', { name: 'Salvar prontuário' }).click();
      await expect(recordDialog).toBeHidden({ timeout: 30_000 });

      // Prescrição: cria 1 item (usa o medicamento seedado).
      await page.getByRole('tab', { name: 'Prescrições' }).click();
      await page.getByRole('button', { name: 'Nova Prescrição' }).click();

      const prescriptionDialog = page.getByRole('dialog', { name: 'Nova prescrição' });
      await expect(prescriptionDialog).toBeVisible();

      // O seletor de medicamento é um combobox (role="combobox"), não um button padrão.
      const medicineCombobox = prescriptionDialog
        .locator('button[role="combobox"]')
        .filter({ hasText: 'Selecione um medicamento' })
        .first();
      await expect(medicineCombobox).toBeVisible({ timeout: 15_000 });
      await medicineCombobox.click();

      // O Popover do combobox abre em portal (fora do dialog). Por isso usamos `page`.
      const searchInput = page.getByPlaceholder('Buscar por nome, código, genérico...');
      await expect(searchInput).toBeVisible({ timeout: 10_000 });
      await searchInput.fill(seed.medicineCode);

      const medicineOption =
        page.getByRole('option').filter({ hasText: seed.medicineCode }).first();
      await expect(medicineOption).toBeVisible({ timeout: 15_000 });
      await medicineOption.click();

      await prescriptionDialog.getByPlaceholder('Ex: 500mg').fill('500mg');
      await prescriptionDialog.getByPlaceholder('Ex: 8/8h').fill('8/8h');
      await prescriptionDialog.getByPlaceholder('Ex: 7 dias').fill('1 dia');

      const createPrescriptionResponse = page.waitForResponse((res) => {
        return (
          res.request().method() === 'POST' &&
          /\/api\/v1\/prescriptions$/.test(res.url())
        );
      });
      await prescriptionDialog.getByRole('button', { name: 'Salvar prescrição' }).click();
      const prescriptionRes = await createPrescriptionResponse;
      if (!prescriptionRes.ok()) {
        const body = await prescriptionRes.text().catch(() => '');
        throw new Error(`Falha ao criar prescrição (HTTP ${prescriptionRes.status()}): ${body}`);
      }
      const createdPrescription = (await prescriptionRes.json().catch(() => null)) as
        | { prescriptionCode?: string }
        | null;
      prescriptionCode = createdPrescription?.prescriptionCode ?? '';
      await expect(prescriptionDialog).toBeHidden({ timeout: 60_000 });

      await context.close();
    });

    await test.step('7) Farmácia: aprovar + dispensar prescrição', async () => {
      const auth = await loginViaApi(CREDS.farmacia.login, CREDS.farmacia.password);
      const context = await browser.newContext({ storageState: storageStateFor(auth) });
      const page = await context.newPage();

      await page.goto('/pharmacy');
      await expect(page.getByRole('heading', { name: 'Farmácia', exact: true })).toBeVisible();

      // Aguarda a prescrição aparecer na fila (pode levar alguns segundos).
      // Prioriza prescriptionCode para reduzir flakiness quando nome do paciente demora a aparecer.
      const queueLookup = prescriptionCode || patientFullName;
      await waitForText(page, queueLookup, 90_000);

      const row = page.getByRole('row', { name: new RegExp(queueLookup, 'i') });
      await expect(row).toBeVisible();
      await row.getByRole('button', { name: /Aprovar & Dispensar/i }).click();

      const dispenseDialog = page.getByRole('dialog');
      await expect(dispenseDialog.getByText(/Dispensar Prescrição/i)).toBeVisible();

      await dispenseDialog.getByRole('button', { name: 'Confirmar Dispensação' }).click();
      await expect(dispenseDialog).toBeHidden({ timeout: 60_000 });

      // Com filtro ACTIVE, a prescrição deve sumir da fila após dispensação.
      await expect(page.getByText(queueLookup)).toBeHidden({ timeout: 60_000 });

      await context.close();
    });

    await test.step('8) Médico: finalizar atendimento com desfecho ALTA', async () => {
      const auth = await loginViaApi(CREDS.medico.login, CREDS.medico.password);
      const context = await browser.newContext({ storageState: storageStateFor(auth) });
      const page = await context.newPage();

      await page.goto(`/medical-records?visitId=${visitId}`);
      await expect(page.getByRole('heading', { name: 'Atendimento' })).toBeVisible();

      await page.getByRole('tab', { name: 'Finalizar' }).click();
      await page.getByRole('button', { name: 'Finalizar atendimento' }).click();

      const finalizeDialog = page.getByRole('dialog', { name: 'Finalizar atendimento' });
      await expect(finalizeDialog).toBeVisible();
      await finalizeDialog.getByRole('button', { name: 'Finalizar atendimento' }).click();

      await expect(page).toHaveURL(/\/triage$/, { timeout: 60_000 });
      await context.close();
    });
  });
});
