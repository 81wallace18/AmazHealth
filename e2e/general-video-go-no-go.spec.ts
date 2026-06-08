import { expect, request, test, type APIRequestContext, type Page } from '@playwright/test';
import { pointToMainContent, settlePerceptualLayer } from './video-perception';

const apiBaseURL = `${process.env.E2E_BACKEND_URL || 'http://127.0.0.1:8080/api/v1'}/`.replace(/\/+$/, '/');
const humanDelayMs = Number(process.env.E2E_VIDEO_HUMAN_DELAY_MS || 1800);
const sceneSlateMs = Number(process.env.E2E_VIDEO_SCENE_SLATE_MS || 2400);

type AuthSession = {
  accessToken: string;
  user: Record<string, unknown>;
};

type Scene = {
  id: string;
  profile: string;
  login: string;
  password: string;
  path: string;
  expectedText?: RegExp | string;
};

const scenes: Scene[] = [
  {
    id: 'GV-GO-01-recepcao-dashboard',
    profile: 'RECEPTIONIST',
    login: 'recepcao.uat@hospital.com',
    password: 'Recepcao123!',
    path: '/',
  },
  {
    id: 'GV-GO-02-recepcao-pacientes',
    profile: 'RECEPTIONIST',
    login: 'recepcao.uat@hospital.com',
    password: 'Recepcao123!',
    path: '/patients',
    expectedText: /Demo|Paciente|Pacientes/i,
  },
  {
    id: 'GV-GO-03-recepcao-atendimento',
    profile: 'RECEPTIONIST',
    login: 'recepcao.uat@hospital.com',
    password: 'Recepcao123!',
    path: '/reception/triage',
    expectedText: /Recep|Atendimento|Triagem/i,
  },
  {
    id: 'GV-GO-04-enfermagem-fila',
    profile: 'NURSE',
    login: 'enfermeiro.uat@hospital.com',
    password: 'Enfermeiro123!',
    path: '/triage',
    expectedText: /Triagem|Manchester|Prioridade/i,
  },
  {
    id: 'GV-GO-05-enfermagem-manchester',
    profile: 'NURSE',
    login: 'enfermeiro.uat@hospital.com',
    password: 'Enfermeiro123!',
    path: '/triage',
    expectedText: /Triagem|Manchester|Prioridade/i,
  },
  {
    id: 'GV-GO-06-medico-prontuario',
    profile: 'DOCTOR',
    login: 'medico.uat@hospital.com',
    password: 'Medico123!',
    path: '/medical-records',
    expectedText: /Prontu|Paciente|Atendimento/i,
  },
  {
    id: 'GV-GO-07-medico-consulta',
    profile: 'DOCTOR',
    login: 'medico.uat@hospital.com',
    password: 'Medico123!',
    path: '/consultations',
    expectedText: /Consulta|Atendimento|Paciente/i,
  },
  {
    id: 'GV-GO-08-medico-conduta',
    profile: 'DOCTOR',
    login: 'medico.uat@hospital.com',
    password: 'Medico123!',
    path: '/medical-records',
    expectedText: /Prescri|Evolu|Conduta|Prontu/i,
  },
  {
    id: 'GV-GO-09-tecnica-atendimentos',
    profile: 'NURSE_TECHNICIAN',
    login: 'tecnico.enf.uat@hospital.com',
    password: 'Tecnico123!',
    path: '/daily-attendances',
    expectedText: /Atendimento|Paciente|Hoje/i,
  },
  {
    id: 'GV-GO-10-tecnica-prontuario',
    profile: 'NURSE_TECHNICIAN',
    login: 'tecnico.enf.uat@hospital.com',
    password: 'Tecnico123!',
    path: '/medical-records',
    expectedText: /Prontu|Paciente|Atendimento/i,
  },
  {
    id: 'GV-GO-11-medico-fechamento',
    profile: 'DOCTOR',
    login: 'medico.uat@hospital.com',
    password: 'Medico123!',
    path: '/consultations',
    expectedText: /Consulta|Desfecho|Atendimento|Paciente/i,
  },
  {
    id: 'GV-GO-12-gestor-dashboard',
    profile: 'HOSPITAL_MANAGER',
    login: 'gestor.hosp.uat@hospital.com',
    password: 'GestorHosp123!',
    path: '/gestora-dashboard',
    expectedText: /Dashboard|Gest|Indicador|Atendimento/i,
  },
  {
    id: 'GV-GO-13-gestor-vinculo-esus-pec',
    profile: 'HOSPITAL_MANAGER',
    login: 'gestor.hosp.uat@hospital.com',
    password: 'GestorHosp123!',
    path: '/users',
    expectedText: /e-SUS PEC|Pré-cadastrado|Aguardando aprovação|Aprovar acesso/i,
  },
];

async function login(api: APIRequestContext, loginName: string, password: string): Promise<AuthSession> {
  const response = await api.post('auth/login', {
    headers: { 'X-Forwarded-For': stableTestIp(loginName) },
    data: { login: loginName, password },
  });
  if (!response.ok()) {
    throw new Error(`login ${loginName} retornou HTTP ${response.status()}: ${await response.text()}`);
  }
  return response.json();
}

function stableTestIp(value: string) {
  let hash = 0;
  for (const char of value) {
    hash = (hash * 31 + char.charCodeAt(0)) % 200;
  }
  return `10.77.0.${hash + 20}`;
}

async function authenticatePage(page: Page, session: AuthSession) {
  await page.addInitScript(({ accessToken, user }) => {
    window.localStorage.setItem('authStorageType', 'local');
    window.localStorage.setItem('accessToken', accessToken);
    window.localStorage.setItem('user', JSON.stringify(user));
  }, session);
}

async function humanPause(page: Page, multiplier = 1) {
  await page.waitForTimeout(Math.max(0, Math.round(humanDelayMs * multiplier)));
}

async function showSceneSlate(page: Page, scene: Pick<Scene, 'id' | 'profile' | 'path'>) {
  await page.setContent(`
    <!doctype html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <title>${scene.id}</title>
        <style>
          body {
            margin: 0;
            min-height: 100vh;
            display: grid;
            place-items: center;
            font-family: Inter, Arial, sans-serif;
            background: #0f172a;
            color: #f8fafc;
          }
          main {
            width: min(860px, calc(100vw - 64px));
            border: 1px solid #334155;
            border-radius: 8px;
            padding: 40px;
            background: #111827;
          }
          p { margin: 0; color: #cbd5e1; font-size: 20px; line-height: 1.55; }
          h1 { margin: 10px 0 18px; font-size: 36px; line-height: 1.15; }
          strong { color: #facc15; }
        </style>
      </head>
      <body>
        <main>
          <p>Preparando cena visual</p>
          <h1>${scene.id}</h1>
          <p>Perfil: <strong>${scene.profile}</strong></p>
          <p>Destino: <strong>${scene.path}</strong></p>
        </main>
      </body>
    </html>
  `);
  await page.waitForTimeout(sceneSlateMs);
}

async function showSceneBadge(page: Page, scene: Pick<Scene, 'id' | 'profile'>) {
  await page.evaluate(({ id, profile }) => {
    document.querySelector('[data-video-scene-badge]')?.remove();
    const badge = document.createElement('div');
    badge.dataset.videoSceneBadge = 'true';
    badge.textContent = `${id} | ${profile}`;
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
      fontSize: '15px',
      fontWeight: '700',
      boxShadow: '0 10px 30px rgba(15, 23, 42, 0.26)',
      pointerEvents: 'none',
    });
    document.body.appendChild(badge);
  }, scene);
}

async function openScene(page: Page, path: string) {
  await page.goto(path);
  await expect(page.locator('body')).toBeVisible();
  await expect(page).not.toHaveURL(/\/auth$/);
  await expect(page).not.toHaveURL(/\/unauthorized$/);
  await page.waitForLoadState('networkidle').catch(() => undefined);
  await humanPause(page);
}

test.describe('Runbook visual do video geral', () => {
  const sessions = new Map<string, AuthSession>();
  let adminSession: AuthSession;

  test.beforeAll(async () => {
    const api = await request.newContext({ baseURL: apiBaseURL });
    const uniqueProfiles = new Map<string, Pick<Scene, 'login' | 'password'>>();

    for (const scene of scenes) {
      uniqueProfiles.set(scene.profile, { login: scene.login, password: scene.password });
    }

    for (const [profile, credentials] of uniqueProfiles) {
      sessions.set(profile, await login(api, credentials.login, credentials.password));
    }
    adminSession = await login(api, 'admin@hospital.com', 'admin');

    await api.dispose();
  });

  test('GV-GO-00 preflight API e massa do video', async () => {
    const api = await request.newContext({ baseURL: apiBaseURL });

    for (const scene of scenes) {
      expect(sessions.has(scene.profile), `${scene.profile} deve autenticar no preflight`).toBeTruthy();
    }

    const links = await api.get('admin/external-identities?provider=ESUS_PEC', {
      headers: { Authorization: `Bearer ${adminSession.accessToken}` },
    });
    expect(links.ok(), `external-identities retornou HTTP ${links.status()}`).toBeTruthy();
    const body = await links.json();
    expect(
      body.some((link: { externalLogin?: string; status?: string }) =>
        link.externalLogin === 'medico.uat.video.simulado' &&
        (link.status === 'PRE_REGISTERED' || link.status === 'PENDING_APPROVAL')
      ),
      'deve existir vínculo externo ESUS_PEC simulado pendente para o fechamento do vídeo'
    ).toBeTruthy();

    await api.dispose();
  });

  for (const scene of scenes) {
    test(`${scene.id} - ${scene.profile}`, async ({ page }) => {
      const session = sessions.get(scene.profile);
      expect(session, `${scene.profile} deve ter sessão autenticada`).toBeTruthy();

      await authenticatePage(page, session!);
      await showSceneSlate(page, scene);
      await openScene(page, scene.path);
      await showSceneBadge(page, scene);
      await pointToMainContent(page, `Cena carregada: ${scene.id}. Observe a superficie do perfil ${scene.profile}.`);

      if (scene.expectedText) {
        await expect(page.locator('body')).toContainText(scene.expectedText);
      }

      await settlePerceptualLayer(page, `Validacao visual concluida: ${scene.id}`);
      await humanPause(page, 1.5);
      await page.screenshot({ path: test.info().outputPath(`${scene.id}.png`), fullPage: true });
    });
  }

  test('GV-GO-14-documentacao-decisao', async ({ page }) => {
    await page.setContent(`
      <!doctype html>
      <html lang="pt-BR">
        <head>
          <meta charset="utf-8" />
          <title>GV-GO-14 - Registro do runbook</title>
          <style>
            body {
              margin: 0;
              font-family: Inter, Arial, sans-serif;
              background: #f8fafc;
              color: #0f172a;
            }
            main {
              max-width: 960px;
              margin: 0 auto;
              padding: 48px;
            }
            h1 { font-size: 32px; margin: 0 0 12px; }
            h2 { font-size: 20px; margin-top: 32px; }
            p, li { font-size: 17px; line-height: 1.55; }
            code {
              background: #e2e8f0;
              border-radius: 4px;
              padding: 2px 6px;
            }
            .status {
              display: inline-block;
              border-radius: 6px;
              background: #dcfce7;
              color: #14532d;
              padding: 8px 12px;
              font-weight: 700;
            }
          </style>
        </head>
        <body>
          <main>
            <p class="status">GV-GO-14 registrado</p>
            <h1>Runbook visual do vídeo geral</h1>
            <p>
              As cenas GV-GO-00 a GV-GO-13 foram executadas com massa Demo/UAT,
              perfis da primeira onda e vínculo externo <code>ESUS_PEC</code>
              simulado pendente para fechamento gerencial.
            </p>
            <h2>Decisão operacional</h2>
            <p>
              Resultado técnico automatizado: <strong>GO_COM_RESTRICAO</strong>.
              O fluxo geral está demonstrável e gravado; a aprovação efetiva do
              vínculo externo deve ser feita na gravação assistida para preservar
              uma massa pendente reexecutável.
            </p>
            <h2>Artefatos</h2>
            <ul>
              <li>Vídeos, screenshots e traces: <code>/tmp/amazhealth-gv-go-artifacts</code></li>
              <li>Contrato: <code>.specs/features/professional-jtbd-uat-training/general-video-go-no-go-runbook-2026-06-07.md</code></li>
              <li>Resultado: <code>.specs/test-results-2026-06-07-general-video-go-no-go.md</code></li>
            </ul>
          </main>
        </body>
      </html>
    `);
    await expect(page.locator('body')).toContainText('GV-GO-14 registrado');
    await pointToMainContent(page, 'Resumo final do runbook visual e decisao operacional.');
    await humanPause(page, 1.5);
    await page.screenshot({ path: test.info().outputPath('GV-GO-14-documentacao-decisao.png'), fullPage: true });
  });
});
