import { expect, request, test, type APIRequestContext, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { clickWithPerception, focusLocator, pointToMainContent, settlePerceptualLayer } from './video-perception';

const apiBaseURL = `${process.env.E2E_BACKEND_URL || 'http://127.0.0.1:8080/api/v1'}/`.replace(/\/+$/, '/');
const artifactRoot = process.env.E2E_JOB_VIDEO_ARTIFACT_DIR || '/tmp/amazhealth-job-complete-videos-2026-06-08-pilot';
const summaryPath = process.env.E2E_JOB_VIDEO_SUMMARY_PATH || path.join(artifactRoot, 'JOB-REC-01-summary.json');
const humanDelayMs = Number(process.env.E2E_VIDEO_HUMAN_DELAY_MS || 1800);

type AuthSession = {
  accessToken: string;
  user: Record<string, unknown>;
};

type ReceptionPatientListItem = {
  patientId: string;
  patientName: string;
  patientCode: string;
  dateOfBirth: string;
  inAttendance: boolean;
};

type ReceptionQueueItem = {
  patientName: string;
  patientCode: string;
  triageColor: string | null;
  waitingTimeMinutes: number;
};

type PaginatedResponse<T> = {
  content: T[];
  totalElements: number;
};

function stableTestIp(value: string) {
  let hash = 0;
  for (const char of value) {
    hash = (hash * 31 + char.charCodeAt(0)) % 200;
  }
  return `10.77.0.${hash + 20}`;
}

function generateValidCpf(seed: string): string {
  const digits = seed.replace(/\D/g, '').padStart(9, '0').slice(-9);
  const digit = (value: string, factor: number) => {
    let total = 0;
    for (let index = 0; index < value.length; index += 1) {
      total += Number(value[index]) * (factor - index);
    }
    const remainder = total % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };
  const d1 = digit(digits, 10);
  const d2 = digit(`${digits}${d1}`, 11);
  return `${digits}${d1}${d2}`;
}

function generateValidCns(seed: string): string {
  const base = `7${seed.replace(/\D/g, '').padStart(12, '0').slice(-12)}`;
  for (let suffix = 0; suffix <= 99; suffix += 1) {
    const candidate = `${base}${String(suffix).padStart(2, '0')}`;
    let total = 0;
    for (let index = 0; index < candidate.length; index += 1) {
      total += Number(candidate[index]) * (15 - index);
    }
    if (total % 11 === 0) return candidate;
  }
  throw new Error(`nao foi possivel gerar CNS valido para ${seed}`);
}

async function login(api: APIRequestContext, loginName: string, password: string): Promise<AuthSession> {
  const response = await api.post('auth/login', {
    headers: { 'X-Forwarded-For': stableTestIp(loginName) },
    data: { login: loginName, password },
  });
  expect(response.ok(), `login RECEPTIONIST retornou HTTP ${response.status()}: ${await response.text()}`).toBeTruthy();
  return response.json();
}

async function apiGet<T>(api: APIRequestContext, token: string, pathName: string): Promise<T> {
  const response = await api.get(pathName.replace(/^\/+/, ''), {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(response.ok(), `GET ${pathName} retornou HTTP ${response.status()}: ${await response.text()}`).toBeTruthy();
  return response.json();
}

async function apiPatchBestEffort(api: APIRequestContext, token: string, pathName: string, data: Record<string, unknown>) {
  await api.patch(pathName.replace(/^\/+/, ''), {
    data,
    headers: { Authorization: `Bearer ${token}` },
  });
}

async function cleanupPreviousVideoPatients(api: APIRequestContext, token: string) {
  const previousPatients = await apiGet<PaginatedResponse<ReceptionPatientListItem>>(
    api,
    token,
    '/reception/patients?q=Video%20REC&size=50'
  );

  for (const patient of previousPatients.content) {
    if (!/^Paciente Video REC/.test(patient.patientName)) continue;
    const attendances = await apiGet<PaginatedResponse<{ id: string; status: string }>>(
      api,
      token,
      `/attendances?patientId=${patient.patientId}&status=CREATED&size=20`
    );

    for (const attendance of attendances.content) {
      await apiPatchBestEffort(api, token, `/attendances/${attendance.id}/status`, { newStatus: 'CANCELLED' });
    }
  }
}

async function authenticatePage(page: Page, session: AuthSession) {
  await page.addInitScript(({ accessToken, user }) => {
    window.localStorage.setItem('authStorageType', 'local');
    window.localStorage.setItem('accessToken', accessToken);
    window.localStorage.setItem('user', JSON.stringify(user));
  }, session);
}

function extractRoles(user: Record<string, unknown>): string[] {
  const role = user.role;
  const roles = user.roles;
  if (typeof role === 'string') return [role];
  if (Array.isArray(roles)) return roles.filter((item): item is string => typeof item === 'string');
  return [];
}

async function humanPause(page: Page, multiplier = 1) {
  await page.waitForTimeout(Math.max(0, Math.round(humanDelayMs * multiplier)));
}

async function screenshot(page: Page, name: string) {
  await page.screenshot({ path: path.join(artifactRoot, name), fullPage: true });
}

async function fillWithPerception(page: Page, locator: ReturnType<Page['locator']>, value: string, label: string) {
  await focusLocator(page, locator, label);
  await locator.fill(value);
  await humanPause(page);
}

async function showJobBadge(page: Page, runId: string) {
  await page.evaluate((id) => {
    document.querySelector('[data-job-video-badge]')?.remove();
    const badge = document.createElement('div');
    badge.dataset.jobVideoBadge = 'true';
    badge.textContent = `JOB-REC-01 | RECEPTIONIST | ${id}`;
    Object.assign(badge.style, {
      position: 'fixed',
      left: '16px',
      bottom: '16px',
      zIndex: '2147483647',
      maxWidth: 'calc(100vw - 32px)',
      padding: '10px 14px',
      borderRadius: '6px',
      background: 'rgba(15, 23, 42, 0.92)',
      color: '#f8fafc',
      fontFamily: 'Inter, Arial, sans-serif',
      fontSize: '14px',
      fontWeight: '700',
      boxShadow: '0 10px 30px rgba(15, 23, 42, 0.26)',
      pointerEvents: 'none',
    });
    document.body.appendChild(badge);
  }, runId);
}

test.describe('Videos por job completo', () => {
  test('JOB-REC-01 - recepcao cadastra paciente e abre atendimento para triagem', async ({ page }) => {
    fs.mkdirSync(artifactRoot, { recursive: true });

    const runId = process.env.E2E_JOB_VIDEO_RUN_ID || `REC${Date.now().toString(36).toUpperCase()}`;
    const timestampSeed = Date.now().toString();
    const patientFirstName = 'Paciente';
    const patientLastName = `Video ${runId}`;
    const patientFullName = `${patientFirstName} ${patientLastName}`;
    const motherName = `Mae Video ${runId}`;
    const chiefComplaint = `Dor abdominal leve registrada no piloto ${runId}`;
    const fictitiousCpf = generateValidCpf(timestampSeed);
    const fictitiousCns = generateValidCns(timestampSeed);
    const receptionLogin = process.env.E2E_RECEPTIONIST_LOGIN || 'recepcao.uat@hospital.com';
    const receptionPassword = process.env.E2E_RECEPTIONIST_PASSWORD || 'Recepcao123!';

    const api = await request.newContext({ baseURL: apiBaseURL });
    const session = await login(api, receptionLogin, receptionPassword);
    const roles = extractRoles(session.user);
    expect(roles, 'sessao autenticada deve ser RECEPTIONIST').toContain('RECEPTIONIST');

    await cleanupPreviousVideoPatients(api, session.accessToken);
    await apiGet(api, session.accessToken, '/reception/patients?q=preflight&size=1');
    await apiGet(api, session.accessToken, '/reception/triage-board');

    await authenticatePage(page, session);
    await page.goto('/reception/triage');
    await expect(page).not.toHaveURL(/\/auth|\/unauthorized/);
    await expect(page.getByRole('heading', { name: 'Recepção' })).toBeVisible();
    await showJobBadge(page, runId);
    await pointToMainContent(page, 'Recepcao: buscar, cadastrar e abrir atendimento inicial.');
    await humanPause(page);
    await screenshot(page, 'JOB-REC-01-01-recepcao-inicial.png');

    const searchInput = page.getByPlaceholder('Nome, CPF ou cartão SUS...');
    await fillWithPerception(page, searchInput, runId, 'Buscar paciente pelo identificador desta execucao.');
    await clickWithPerception(page, page.getByRole('button', { name: /^Buscar$/ }), 'Buscar paciente antes de cadastrar.');
    await expect(page.getByText('Nenhum paciente encontrado. Cadastre um novo paciente acima.')).toBeVisible();
    await settlePerceptualLayer(page, 'Nenhum paciente encontrado: a recepcao vai cadastrar.');
    await humanPause(page);
    await screenshot(page, 'JOB-REC-01-02-busca-sem-resultado.png');

    await clickWithPerception(page, page.getByRole('button', { name: /Novo Atendimento|Novo/i }), 'Iniciar cadastro de novo atendimento.');
    await expect(page.getByRole('dialog')).toContainText('Cadastre o paciente para abrir um novo atendimento.');
    await humanPause(page);

    await fillWithPerception(page, page.getByLabel('Cartão SUS *'), fictitiousCns, 'Preencher documento ficticio do paciente.');
    await fillWithPerception(page, page.getByLabel('CPF'), fictitiousCpf, 'Preencher CPF ficticio gerado para teste.');
    await fillWithPerception(page, page.getByLabel('Nome *'), patientFullName, 'Preencher nome do paciente.');
    const genderSelect = page.getByRole('combobox').first();
    await clickWithPerception(page, genderSelect, 'Selecionar sexo.');
    await clickWithPerception(page, page.getByRole('option', { name: 'Feminino' }), 'Sexo feminino selecionado.');
    await fillWithPerception(page, page.getByLabel('Endereço'), 'Rua do Piloto 100, Serra Pelada', 'Preencher endereco operacional.');
    await fillWithPerception(page, page.getByLabel('Nome da Mãe *'), motherName, 'Preencher nome da mae.');
    await fillWithPerception(page, page.getByLabel('Data de Nascimento *'), '1988-03-12', 'Preencher nascimento.');
    await settlePerceptualLayer(page, 'Cadastro preenchido antes de salvar.');
    await humanPause(page);
    await screenshot(page, 'JOB-REC-01-03-formulario-preenchido.png');

    await clickWithPerception(page, page.getByRole('button', { name: 'Cadastrar e Abrir Atendimento' }), 'Cadastrar paciente e abrir atendimento.');
    await expect(page.getByRole('dialog')).toContainText('Abrir Atendimento');
    await expect(page.getByText(patientFullName)).toBeVisible();
    await humanPause(page);

    await fillWithPerception(page, page.getByLabel('Queixa principal *'), chiefComplaint, 'Registrar queixa principal do atendimento.');
    await clickWithPerception(page, page.getByRole('button', { name: 'Criar Atendimento' }), 'Criar atendimento para enviar a fila.');
    await expect(page.getByText(/Atendimento criado\. Paciente aguardando triagem\.|Paciente aguardando triagem/i)).toBeVisible();

    const finalPatientSearch = await apiGet<PaginatedResponse<ReceptionPatientListItem>>(
      api,
      session.accessToken,
      `/reception/patients?q=${encodeURIComponent(runId)}&size=10`
    );
    expect(finalPatientSearch.content.length, 'busca final deve retornar exatamente 1 paciente do run').toBe(1);
    expect(finalPatientSearch.content[0].patientName).toContain(runId);
    const patientCode = finalPatientSearch.content[0].patientCode;

    await expect
      .poll(async () => {
        const items = await apiGet<ReceptionQueueItem[]>(api, session.accessToken, '/reception/triage-board');
        return items.find((item) => item.patientCode === patientCode && item.patientName.includes(runId));
      }, { timeout: 30_000, message: 'paciente criado deve aparecer na fila de triagem CREATED' })
      .toBeTruthy();

    await clickWithPerception(page, page.getByRole('button', { name: 'Atualizar' }), 'Atualizar fila de triagem.');
    await expect(page.getByRole('heading', { name: /Fila de Triagem/i })).toBeVisible();
    const finalRow = page.getByRole('row').filter({ hasText: patientCode });
    await expect(finalRow).toContainText(patientFullName);
    await expect(finalRow).toContainText('Sem classificação');
    await focusLocator(page, finalRow, 'Paciente aguardando triagem na fila correta.');
    await humanPause(page, 2);
    await screenshot(page, 'JOB-REC-01-04-fila-final.png');

    fs.writeFileSync(summaryPath, JSON.stringify({
      status: 'PASS',
      job: 'JOB-REC-01',
      profile: 'RECEPTIONIST',
      route: '/reception/triage',
      runId,
      patientName: patientFullName,
      motherName,
      documentPolicy: 'CPF/CNS ficticios gerados por algoritmo para teste; nenhum documento real usado.',
      fictitiousCpf,
      fictitiousCns,
      patientCode,
      expectedFinalQueue: 'Fila de Triagem / Aguardando triagem / Sem classificacao',
      artifacts: {
        directory: artifactRoot,
        screenshots: [
          'JOB-REC-01-01-recepcao-inicial.png',
          'JOB-REC-01-02-busca-sem-resultado.png',
          'JOB-REC-01-03-formulario-preenchido.png',
          'JOB-REC-01-04-fila-final.png',
        ],
      },
      authEvidence: {
        login: receptionLogin,
        roles,
      },
    }, null, 2));

    await settlePerceptualLayer(page, 'JOB-REC-01 concluido: paciente aguardando triagem.');
    await api.dispose();
  });
});
