import { expect, request, test, type APIRequestContext, type Page } from '@playwright/test';

const apiBaseURL = `${process.env.E2E_BACKEND_URL || 'http://127.0.0.1:18080/api/v1'}/`.replace(/\/+$/, '/');

type AuthSession = {
  accessToken: string;
  user: {
    staffId?: string | null;
    [key: string]: unknown;
  };
};

async function login(api: APIRequestContext, loginName: string, password: string): Promise<AuthSession> {
  const response = await api.post('auth/login', {
    data: { login: loginName, password },
  });
  expect(response.ok(), `login ${loginName} -> ${response.status()}: ${await response.text()}`).toBeTruthy();
  return response.json();
}

async function apiFetch<T>(
  api: APIRequestContext,
  token: string,
  method: 'GET' | 'POST',
  path: string,
  data?: Record<string, unknown>
): Promise<T> {
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

function validCpfFromSeed(seed: string): string {
  const base = seed.padStart(9, '1').slice(-9).split('').map(Number);
  const firstDigitSum = base.reduce((sum, digit, index) => sum + digit * (10 - index), 0);
  const firstDigit = firstDigitSum % 11 < 2 ? 0 : 11 - (firstDigitSum % 11);
  const secondDigitSum = [...base, firstDigit].reduce((sum, digit, index) => sum + digit * (11 - index), 0);
  const secondDigit = secondDigitSum % 11 < 2 ? 0 : 11 - (secondDigitSum % 11);

  return [...base, firstDigit, secondDigit].join('');
}

test.describe('Fluxo medico de atendimento e prontuario', () => {
  test('abre atendimento sem perder contexto e carrega prescricoes sem crash', async ({ page }) => {
    const runtimeErrors: string[] = [];
    page.on('pageerror', (error) => runtimeErrors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') {
        runtimeErrors.push(message.text());
      }
    });

    const api = await request.newContext({ baseURL: apiBaseURL });
    const admin = await login(api, 'admin@hospital.com', 'admin');
    const nurse = await login(api, 'enfermeiro.uat@hospital.com', 'Enfermeiro123!');
    const doctor = await login(api, 'medico.uat@hospital.com', 'Medico123!');
    expect(doctor.user.staffId, 'usuario medico precisa estar vinculado ao staff').toBeTruthy();

    const unique = Date.now().toString().slice(-8);
    const patient = await apiFetch<{ id: string; firstName: string; lastName: string }>(
      api,
      admin.accessToken,
      'POST',
      '/patients',
      {
        firstName: `MedFlux${unique}`,
        lastName: 'Playwright',
        dateOfBirth: '1988-05-20',
        gender: 'F',
        cpf: validCpfFromSeed(unique),
      }
    );

    const attendance = await apiFetch<{ id: string }>(
      api,
      admin.accessToken,
      'POST',
      '/attendances',
      {
        patientId: patient.id,
        doctorId: doctor.user.staffId,
        chiefComplaint: `Dor abdominal recorrente ${unique}`,
        visitType: 'URGENCIA',
      }
    );

    await apiFetch(
      api,
      nurse.accessToken,
      'POST',
      `/triage/visits/${attendance.id}`,
      {
        vitalSigns: {
          bloodPressure: '120/80',
          heartRate: 84,
          respiratoryRate: 18,
          temperature: 36.8,
          oxygenSaturation: 98,
          glasgowComaScale: 15,
        },
        complaintCategory: 'ABDOMINAL',
        complaintText: 'Dor abdominal sem sinais de instabilidade.',
        painScore: 4,
        triageColor: 'YELLOW',
        triageJustification: 'Smoke Playwright para fluxo medico.',
        overrideReason: 'Classificacao fixada para validar o fluxo medico end-to-end.',
      }
    );

    await authenticatePage(page, doctor);
    await page.goto('/medical-records');

    const newRecordButton = page.getByRole('button', { name: /Novo Prontuario|Novo Prontuário|Nova Evolucao|Nova Evolução/i });
    await expect(newRecordButton).toBeDisabled();
    await expect(page.getByText(/Fila do Médico/i)).toBeVisible();

    await page.goto('/consultations');
    const row = page.getByRole('row').filter({ hasText: patient.firstName }).first();
    await expect(row).toBeVisible();
    await row.getByRole('button', { name: /Abrir atendimento/i }).click();
    await expect(page).toHaveURL(new RegExp(`/medical-records\\?visitId=${attendance.id}(&|$)`));

    await expect(page.getByRole('heading', { name: 'Atendimento', level: 1 })).toBeVisible();
    await expect(page.getByText(new RegExp(`Paciente: ${patient.firstName}`))).toBeVisible();
    await expect(page.getByText(/Dor abdominal recorrente/i)).toBeVisible();
    await expect(newRecordButton).toBeEnabled();

    await page.getByRole('tab', { name: /Prescricoes|Prescrições/i }).click();
    await expect(page).toHaveURL(/tab=prescriptions/);
    await expect(page.getByRole('heading', { name: /Prescricoes|Prescrições/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Nova Prescricao|Nova Prescrição/i })).toBeEnabled();
    await expect(page.getByText(/Nenhuma prescricao|Nenhuma prescrição|Prescrições médicas/i).first()).toBeVisible();

    expect(runtimeErrors.join('\n')).not.toMatch(/Cannot access 'refetch' before initialization|DialogContent.*DialogTitle|Missing `Description`/);
    await api.dispose();
  });
});
