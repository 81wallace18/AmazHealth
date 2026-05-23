import { expect, request, test, type APIRequestContext, type Page } from '@playwright/test';

const apiBaseURL = `${process.env.E2E_BACKEND_URL || 'http://127.0.0.1:8080/api/v1'}/`.replace(/\/+$/, '/');

type AuthSession = { accessToken: string; user: Record<string, unknown> };

function generateCpf(): string {
  const base = String((Date.now() + Math.floor(Math.random() * 1000)) % 1_000_000_000).padStart(9, '0');
  const digit = (value: string, factor: number) => {
    let total = 0;
    for (let index = 0; index < value.length; index += 1) {
      total += Number(value[index]) * (factor - index);
    }
    const remainder = total % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };
  const d1 = digit(base, 10);
  const d2 = digit(`${base}${d1}`, 11);
  return `${base}${d1}${d2}`;
}

async function login(api: APIRequestContext, loginName: string, password: string): Promise<AuthSession> {
  const response = await api.post('auth/login', { data: { login: loginName, password } });
  if (!response.ok()) throw new Error(`login ${loginName} -> ${response.status()}: ${await response.text()}`);
  return response.json();
}

async function apiFetch<T>(api: APIRequestContext, token: string, method: 'GET' | 'POST' | 'PUT', path: string, data?: Record<string, unknown>): Promise<T> {
  const response = await api.fetch(path.replace(/^\/+/, ''), {
    method,
    data,
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(response.ok(), `${method} ${path} -> ${response.status()}: ${await response.text()}`).toBeTruthy();
  return response.json();
}

async function authenticatePage(page: Page, session: AuthSession) {
  await page.addInitScript(({ accessToken, user }) => {
    window.localStorage.setItem('authStorageType', 'local');
    window.localStorage.setItem('accessToken', accessToken);
    window.localStorage.setItem('user', JSON.stringify(user));
  }, session);
}

async function prepareLmeData(api: APIRequestContext, adminToken: string, pharmacistToken: string) {
  const suffix = `${Date.now()}${Math.floor(Math.random() * 100)}`;
  const patient = await apiFetch<{ id: string; firstName: string }>(api, adminToken, 'POST', '/patients', {
    firstName: `LME${suffix.slice(-5)}`,
    lastName: 'Playwright',
    dateOfBirth: '1980-01-01',
    gender: 'M',
    cpf: generateCpf(),
    motherName: 'Mae LME Playwright',
    raceColor: 'parda',
  });

  const medicine = await apiFetch<{ id: string; medicineName: string }>(api, pharmacistToken, 'POST', '/pharmacy/medicines', {
    medicineCode: `LME-PW-${suffix}`,
    medicineName: `Adalimumabe LME ${suffix.slice(-5)}`,
    genericName: 'Adalimumabe',
    strength: '40mg',
    dosageForm: 'INJECTION',
    category: 'OTHER',
    unitPrice: 1,
    reorderLevel: 1,
    isActive: true,
    status: 'ACTIVE',
    requiresPrescription: true,
    isControlled: false,
    minDispenseQuantity: 1,
  });

  const csv = `catmat;nome;apresentacao;forma;concentracao\n123456;Adalimumabe Playwright;Seringa;INJECTION;40mg\n`;
  const importResponse = await api.post('official-medicine-references/import', {
    multipart: {
      file: { name: `catmat-lme-${suffix}.csv`, mimeType: 'text/csv', buffer: Buffer.from(csv) },
      sourceName: 'CATMAT Playwright',
      sourceUrl: 'https://www.gov.br/saude/',
    },
    headers: { Authorization: `Bearer ${pharmacistToken}` },
  });
  expect(importResponse.ok(), `import CATMAT -> ${importResponse.status()}: ${await importResponse.text()}`).toBeTruthy();

  const references = await apiFetch<{ content: Array<{ id: string }> }>(api, pharmacistToken, 'GET', '/official-medicine-references?q=123456&active=true&size=1');
  expect(references.content.length).toBeGreaterThan(0);
  await apiFetch(api, pharmacistToken, 'POST', `/pharmacy/medicines/${medicine.id}/catmat-link`, {
    officialMedicineReferenceId: references.content[0].id,
    lmeEligible: true,
  });

  return { patient, medicine };
}

async function createFinalizedLme(api: APIRequestContext, doctorToken: string, patientId: string, medicineId: string) {
  const lme = await apiFetch<{ id: string }>(api, doctorToken, 'POST', '/lme-requests', {
    patientId,
    requestDate: '2026-05-23',
    weightKg: 70,
    heightCm: 170,
    anthropometrySource: 'manual',
    cid10Code: 'M05.9',
    diagnosis: 'Artrite reumatoide Playwright V2',
    anamnesis: 'Paciente em seguimento especializado para validacao LME V2.',
    previousTreatment: true,
    previousTreatmentDescription: 'Uso previo de metotrexato.',
    incapable: false,
    fillerType: 'PATIENT',
    pcdtChecklist: 'Hemograma e laudo medico conferidos em papel.',
    medications: [{ medicineId, month1Quantity: 1, month2Quantity: 1, month3Quantity: 1, month4Quantity: 1, month5Quantity: 1, month6Quantity: 1 }],
  });
  return apiFetch<{ id: string; status: string }>(api, doctorToken, 'POST', `/lme-requests/${lme.id}/finalize`);
}

test.describe('LME/CEAF V1', () => {
  test('médico cria, finaliza e baixa PDF de LME com medicamento apto', async ({ page }) => {
    const api = await request.newContext({ baseURL: apiBaseURL });
    const admin = await login(api, 'admin@hospital.com', 'admin');
    const doctor = await login(api, process.env.E2E_DOCTOR_LOGIN || 'lme.medico.uat', process.env.E2E_DOCTOR_PASSWORD || 'Medico123!');
    const pharmacist = await login(api, process.env.E2E_PHARMACIST_LOGIN || 'lme.farmacia.uat', process.env.E2E_PHARMACIST_PASSWORD || 'Farmacia123!');
    const { patient, medicine } = await prepareLmeData(api, admin.accessToken, pharmacist.accessToken);

    await authenticatePage(page, doctor);
    await page.goto('/lme-ceaf');

    await expect(page.getByRole('heading', { name: 'LME/CEAF' })).toBeVisible();
    await page.getByPlaceholder('Buscar paciente por nome, CPF ou CNS').fill(patient.firstName);
    await page.getByRole('button', { name: /Buscar/i }).first().click();
    await page.getByRole('button', { name: new RegExp(patient.firstName, 'i') }).click();

    await page.getByPlaceholder(/Ex: M05\.9/i).fill('M05.9');
    await page.locator('input[type="number"]').nth(0).fill('70');
    await page.locator('input[type="number"]').nth(1).fill('170');
    await page.locator('textarea').nth(0).fill('Artrite reumatoide Playwright');
    await page.locator('textarea').nth(1).fill('Paciente em seguimento especializado.');
    await page.getByRole('switch').first().click();
    await page.locator('textarea').nth(2).fill('Uso previo de metotrexato.');

    await page.getByPlaceholder(/Buscar medicamento apto/i).fill(medicine.medicineName);
    await page.getByRole('button', { name: /Buscar/i }).nth(1).click();
    await page.getByRole('button', { name: new RegExp(medicine.medicineName, 'i') }).click();
    await page.getByRole('row').filter({ hasText: medicine.medicineName }).getByRole('spinbutton').first().fill('1');

    await page.getByRole('button', { name: /Salvar rascunho/i }).click();
    await expect(page.getByText('Solicitação salva', { exact: true })).toBeVisible();
    const finalizeResponsePromise = page.waitForResponse((response) => (
      response.url().includes('/lme-requests/')
      && response.url().includes('/finalize')
      && response.request().method() === 'POST'
    ));
    await page.getByRole('button', { name: /Finalizar/i }).click();
    const finalizeResponse = await finalizeResponsePromise;
    expect(finalizeResponse.ok(), `finalize LME -> ${finalizeResponse.status()}: ${await finalizeResponse.text()}`).toBeTruthy();
    const finalized = await finalizeResponse.json() as { id: string; status: string };
    expect(finalized.status).toBe('FINALIZED');
    await expect(page.getByText('LME finalizada', { exact: true })).toBeVisible();

    const pdfResponse = await api.fetch(`lme-requests/${finalized.id}/pdf`, {
      headers: { Authorization: `Bearer ${doctor.accessToken}` },
    });
    expect(pdfResponse.ok(), `PDF LME -> ${pdfResponse.status()}: ${await pdfResponse.text()}`).toBeTruthy();
    expect(pdfResponse.headers()['content-type']).toContain('application/pdf');

    await api.dispose();
  });

  test('farmácia vê saneamento CATMAT/LME e admin sem policy fica em modo consulta', async ({ page }) => {
    const api = await request.newContext({ baseURL: apiBaseURL });
    const admin = await login(api, process.env.E2E_ADMIN_CONSULTA_LOGIN || 'lme.admin.uat', process.env.E2E_ADMIN_CONSULTA_PASSWORD || 'Admin123!');
    const pharmacist = await login(api, process.env.E2E_PHARMACIST_LOGIN || 'lme.farmacia.uat', process.env.E2E_PHARMACIST_PASSWORD || 'Farmacia123!');

    await authenticatePage(page, pharmacist);
    await page.goto('/pharmacy');
    await page.getByRole('tab', { name: /CATMAT\/LME/i }).click();
    await expect(page.getByText(/Importação administrada/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Importar/i })).toBeEnabled();

    await authenticatePage(page, admin);
    await page.goto('/pharmacy');
    await page.getByRole('tab', { name: /CATMAT\/LME/i }).click();
    await expect(page.getByText(/modo consulta/i)).toBeVisible();

    await api.dispose();
  });

  test('gestão autoriza APAC manual e farmácia acompanha sem permissão de autorização', async ({ page }) => {
    const api = await request.newContext({ baseURL: apiBaseURL });
    const admin = await login(api, 'admin@hospital.com', 'admin');
    const doctor = await login(api, process.env.E2E_DOCTOR_LOGIN || 'lme.medico.uat', process.env.E2E_DOCTOR_PASSWORD || 'Medico123!');
    const pharmacist = await login(api, process.env.E2E_PHARMACIST_LOGIN || 'lme.farmacia.uat', process.env.E2E_PHARMACIST_PASSWORD || 'Farmacia123!');
    const { patient, medicine } = await prepareLmeData(api, admin.accessToken, pharmacist.accessToken);
    const finalized = await createFinalizedLme(api, doctor.accessToken, patient.id, medicine.id);
    const apacNumber = `APAC-PW-${Date.now()}`;
    await apiFetch(api, pharmacist.accessToken, 'POST', `/lme-requests/${finalized.id}/review/start`, { notes: 'Documentos conferidos pela farmácia' });
    await apiFetch(api, admin.accessToken, 'POST', `/lme-requests/${finalized.id}/review/authorize`, {
      apacNumber,
      apacValidFrom: '2026-06-01',
      apacValidTo: '2026-11-30',
      notes: 'Autorização administrativa Playwright',
    });

    await authenticatePage(page, admin);
    await page.goto('/lme-ceaf');
    await page.getByRole('tab', { name: 'Autorização/APAC' }).click();
    await expect(page.getByText(/V2 registra avaliação interna, decisão e número\/vigência/i)).toBeVisible();
    const authorizedRow = page.getByRole('row').filter({ hasText: apacNumber });
    await expect(authorizedRow).toBeVisible();
    await expect(authorizedRow.getByText('2026-06-01 a 2026-11-30')).toBeVisible();
    await authorizedRow.getByRole('button', { name: /Histórico/i }).click();
    await expect(page.getByText('Histórico de autorização')).toBeVisible();
    await expect(page.getByText(`APAC ${apacNumber} · 2026-06-01 a 2026-11-30`)).toBeVisible();

    await authenticatePage(page, pharmacist);
    await page.goto('/lme-ceaf');
    await page.getByRole('tab', { name: 'Autorização/APAC' }).click();
    await expect(page.getByText(/autorização final e APAC ficam com gestão/i)).toBeVisible();
    await expect(page.getByPlaceholder('Informado pelo fluxo oficial')).toBeDisabled();
    await expect(page.getByRole('button', { name: /^Autorizar$/ })).toHaveCount(0);

    await api.dispose();
  });
});
