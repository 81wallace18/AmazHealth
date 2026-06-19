import { expect, request, test, type APIRequestContext, type Page } from '@playwright/test';

const apiBaseURL = `${process.env.E2E_BACKEND_URL || 'http://127.0.0.1:8080/api/v1'}/`.replace(/\/+$/, '/');

type AuthSession = {
  accessToken: string;
  user: Record<string, unknown>;
};

async function login(api: APIRequestContext, loginName: string, password: string): Promise<AuthSession> {
  const response = await api.post('auth/login', {
    data: { login: loginName, password },
  });
  if (!response.ok()) {
    throw new Error(`login ${loginName} retornou HTTP ${response.status()}: ${await response.text()}`);
  }
  return response.json();
}

async function apiFetch<T>(
  api: APIRequestContext,
  token: string,
  method: 'GET' | 'POST' | 'PATCH',
  path: string,
  data?: Record<string, unknown>
): Promise<T> {
  const response = await api.fetch(path.replace(/^\/+/, ''), {
    method,
    data,
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(response.ok(), `${method} ${path} -> ${response.status()}`).toBeTruthy();
  return response.json();
}

async function createPatient(api: APIRequestContext, token: string, suffix: string) {
  const unique = `${Date.now()}${Math.floor(Math.random() * 10)}`;
  return apiFetch<{ id: string; firstName: string; lastName: string }>(api, token, 'POST', '/patients', {
    firstName: `R35${suffix}${unique.slice(-5)}`,
    lastName: 'Playwright',
    dateOfBirth: '1985-01-01',
    gender: 'M',
    cpf: unique.padStart(11, '0').slice(0, 11),
  });
}

async function createAdmission(api: APIRequestContext, token: string, patientId: string, physicianId: string, reason: string) {
  return apiFetch<{ id: string; patientName: string }>(api, token, 'POST', '/admissions', {
    patientId,
    attendingPhysicianId: physicianId,
    admissionType: 'EMERGENCY',
    admissionReason: reason,
    priorityLevel: 3,
  });
}

async function createDedicatedBeds(api: APIRequestContext, token: string) {
  const unique = Date.now().toString().slice(-6);
  const ward = await apiFetch<{ id: string }>(api, token, 'POST', '/wards', {
    code: `R35-${unique}`,
    name: `R3.5 Playwright ${unique}`,
    description: 'Enfermaria dedicada ao smoke R3.5',
    wardType: 'INFIRMARY',
    capacityLimit: 2,
  });

  await apiFetch(api, token, 'POST', '/beds', {
    wardId: ward.id,
    bedNumber: `R35-${unique}-A`,
    bedType: 'STANDARD',
  });
  await apiFetch(api, token, 'POST', '/beds', {
    wardId: ward.id,
    bedNumber: `R35-${unique}-B`,
    bedType: 'STANDARD',
  });
}

async function authenticatePage(page: Page, session: AuthSession) {
  await page.addInitScript(({ accessToken, user }) => {
    window.localStorage.setItem('authStorageType', 'local');
    window.localStorage.setItem('accessToken', accessToken);
    window.localStorage.setItem('user', JSON.stringify(user));
  }, session);
}

async function chooseFirstSelectOption(page: Page, triggerName: RegExp, optionName?: RegExp) {
  await page.getByRole('combobox', { name: triggerName }).click();
  const option = optionName
    ? page.getByRole('option', { name: optionName }).first()
    : page.getByRole('option').first();
  await expect(option).toBeVisible();
  await option.click();
}

async function chooseFirstDialogSelectOption(page: Page, optionName?: RegExp) {
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('combobox').click();
  const option = optionName
    ? page.getByRole('option', { name: optionName }).first()
    : page.getByRole('option').first();
  await expect(option).toBeVisible();
  await option.click();
}

test.describe('R3.5 UI workflows', () => {
  test('F3-B Internação expõe lista operacional, mapa, alocação, transferência e alta', async ({ page }) => {
    const api = await request.newContext({ baseURL: apiBaseURL });
    const admin = await login(api, 'admin@hospital.com', 'admin');
    const doctors = await apiFetch<Array<{ id: string }>>(api, admin.accessToken, 'GET', '/staff/doctors/active');
    expect(doctors.length, 'médicos ativos').toBeGreaterThan(0);
    await createDedicatedBeds(api, admin.accessToken);

    const patient = await createPatient(api, admin.accessToken, 'Internacao');
    const admission = await createAdmission(
      api,
      admin.accessToken,
      patient.id,
      doctors[0].id,
      'R3.5 Playwright internação completa'
    );

    await authenticatePage(page, admin);
    await page.goto('/admissions');

    await expect(page.getByRole('heading', { name: 'Internações', level: 1 })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Mapa de Leitos' })).toBeVisible();
    await expect(page.getByText(patient.firstName).first()).toBeVisible();

    const row = page.getByRole('row').filter({ hasText: patient.firstName }).first();
    await row.getByRole('button').click();
    await page.getByRole('menuitem', { name: /Alocar leito/i }).click();
    await chooseFirstDialogSelectOption(page);
    await page.getByRole('button', { name: /Confirmar alocação/i }).click();
    await expect(page.getByText(/Leito alocado com sucesso/i)).toBeVisible();

    await expect(row).toContainText(/Leito atribuído|Ativa/i);
    await row.getByRole('button').click();
    await page.getByRole('menuitem', { name: /Transferir leito/i }).click();
    await chooseFirstDialogSelectOption(page);
    await page.getByRole('button', { name: /Confirmar transferência/i }).click();
    await expect(page.getByText(/transferido de leito com sucesso/i)).toBeVisible();

    await row.getByRole('button').click();
    await page.getByRole('menuitem', { name: /Registrar alta/i }).click();
    const dischargeDialog = page.getByRole('dialog', { name: /Registrar alta/i });
    await dischargeDialog.getByPlaceholder(/Alta médica/i).fill('Alta médica R3.5');
    await dischargeDialog.getByPlaceholder(/Instruções/i).fill('Orientações registradas no smoke R3.5.');
    const dischargeResponsePromise = page.waitForResponse((response) =>
      response.url().includes('/admissions/') && response.url().includes('/discharge')
    );
    await dischargeDialog.getByRole('button', { name: /Confirmar alta/i }).click();
    const dischargeResponse = await dischargeResponsePromise;
    expect(
      dischargeResponse.ok(),
      `alta ${dischargeResponse.url()} retornou HTTP ${dischargeResponse.status()}: ${await dischargeResponse.text()}`
    ).toBeTruthy();
    await expect(page.getByText(/Alta registrada com sucesso/i).first()).toBeVisible();

    await page.getByRole('tab', { name: 'Mapa de Leitos' }).click();
    await expect(page.getByRole('heading', { name: 'Mapa de Leitos' })).toBeVisible();

    await api.dispose();
    expect(admission.id).toBeTruthy();
  });

  test('F3-D Laboratório avança SOLICITADO para COLETADO e LAUDADO pela UI', async ({ page }) => {
    const api = await request.newContext({ baseURL: apiBaseURL });
    const admin = await login(api, 'admin@hospital.com', 'admin');
    const doctor = await login(api, 'medico.uat@hospital.com', 'Medico123!');
    const patient = await createPatient(api, admin.accessToken, 'Lab');
    const testCode = `R35-${Date.now()}`;

    await apiFetch(api, doctor.accessToken, 'POST', '/lab-tests/orders', {
      patientId: patient.id,
      testCode,
      testName: 'Hemograma R3.5 Playwright',
      notes: 'Pedido criado para validação R3.5',
    });

    await authenticatePage(page, doctor);
    await page.goto('/laboratory');

    const row = page.getByRole('row').filter({ hasText: testCode });
    await expect(row).toContainText('Solicitado');
    await row.getByRole('button', { name: /Coletar/i }).click();
    await expect(page.getByText(/Exame marcado como coletado/i).first()).toBeVisible();
    await expect(row).toContainText('Coletado');

    await row.getByRole('button', { name: /Laudar/i }).click();
    await page.getByPlaceholder(/resultado\/laudo/i).fill('Resultado R3.5 dentro dos parâmetros esperados.');
    await page.getByRole('button', { name: /Finalizar laudo/i }).click();
    await expect(page.getByText(/Exame marcado como laudado/i).first()).toBeVisible();
    await expect(row).toContainText('Laudado');

    await api.dispose();
  });

  test('F3-H Faturamento cancela fatura pendente pela UI e bloqueia nova ação', async ({ page }) => {
    const api = await request.newContext({ baseURL: apiBaseURL });
    const admin = await login(api, 'admin@hospital.com', 'admin');
    const finance = await login(api, 'financeiro.uat@hospital.com', 'Financeiro123!');
    const patient = await createPatient(api, admin.accessToken, 'Billing');

    const bill = await apiFetch<{ billNumber: string }>(api, finance.accessToken, 'POST', '/billing', {
      patientId: patient.id,
      billDate: new Date().toISOString().slice(0, 10),
      subtotal: 120,
      taxAmount: 0,
      discountAmount: 0,
      totalAmount: 120,
      paymentMethod: 'PIX',
      notes: 'Fatura criada para validação R3.5',
    });

    await authenticatePage(page, finance);
    await page.goto('/billing');

    const row = page.getByRole('row').filter({ hasText: bill.billNumber });
    await expect(row).toContainText('Pendente');
    await row.getByRole('button', { name: /Cancelar fatura/i }).click();
    await expect(row).toContainText('Cancelado');
    await expect(row.getByRole('button', { name: /Cancelar fatura/i })).toBeDisabled();

    await api.dispose();
  });
});
