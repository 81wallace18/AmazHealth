import { expect, request, test, type APIRequestContext, type Page } from '@playwright/test';
import { clickWithPerception, pointToMainContent, settlePerceptualLayer } from './video-perception';

const apiBaseURL = `${process.env.E2E_BACKEND_URL || 'http://127.0.0.1:8080/api/v1'}/`.replace(/\/+$/, '/');
const humanDelayMs = Number(process.env.E2E_VIDEO_HUMAN_DELAY_MS || 1800);
const sceneSlateMs = Number(process.env.E2E_VIDEO_SCENE_SLATE_MS || 2400);

type AuthSession = {
  accessToken: string;
  user: Record<string, unknown>;
};

type ProfileCredentials = {
  login: string;
  password: string;
};

type UatScene = {
  id: string;
  profile: string;
  path: string;
  mode: 'allowed' | 'blocked';
  expectedText?: RegExp | string;
  covers: string[];
};

const credentialsByProfile: Record<string, ProfileCredentials> = {
  RECEPTIONIST: { login: 'recepcao.uat@hospital.com', password: 'Recepcao123!' },
  NURSE: { login: 'enfermeiro.uat@hospital.com', password: 'Enfermeiro123!' },
  NURSE_TECHNICIAN: { login: 'tecnico.enf.uat@hospital.com', password: 'Tecnico123!' },
  NURSE_MANAGER: { login: 'enf.chefe.uat@hospital.com', password: 'EnfChefe123!' },
  DOCTOR: { login: 'medico.uat@hospital.com', password: 'Medico123!' },
  PHARMACIST: { login: 'farmacia.uat@hospital.com', password: 'Farmacia123!' },
  HOSPITAL_MANAGER: { login: 'gestor.hosp.uat@hospital.com', password: 'GestorHosp123!' },
  FINANCE: { login: 'financeiro.uat@hospital.com', password: 'Financeiro123!' },
  ADMIN: { login: 'admin@hospital.com', password: 'admin' },
};

const scenes: UatScene[] = [
  {
    id: 'UAT-REC-01-02-painel-pacientes',
    profile: 'RECEPTIONIST',
    path: '/patients',
    mode: 'allowed',
    expectedText: /Paciente|Pacientes|Demo/i,
    covers: ['UAT-REC-01', 'UAT-REC-02'],
  },
  {
    id: 'UAT-REC-04-atendimento-sem-triagem-clinica',
    profile: 'RECEPTIONIST',
    path: '/reception/triage',
    mode: 'allowed',
    expectedText: /Recep|Atendimento|Triagem/i,
    covers: ['UAT-REC-04'],
  },
  {
    id: 'UAT-REC-06-bloqueio-prontuario',
    profile: 'RECEPTIONIST',
    path: '/medical-records',
    mode: 'blocked',
    covers: ['UAT-REC-06'],
  },
  {
    id: 'UAT-NUR-01-board-triagem',
    profile: 'NURSE',
    path: '/triage',
    mode: 'allowed',
    expectedText: /Triagem|Manchester|Prioridade/i,
    covers: ['UAT-NUR-01'],
  },
  {
    id: 'UAT-NUR-04-prontuario-evolucao',
    profile: 'NURSE',
    path: '/medical-records',
    mode: 'allowed',
    expectedText: /Prontu|Paciente|Evolu|Atendimento/i,
    covers: ['UAT-NUR-04'],
  },
  {
    id: 'UAT-TEC-01-contexto-atendimentos',
    profile: 'NURSE_TECHNICIAN',
    path: '/daily-attendances',
    mode: 'allowed',
    expectedText: /Atendimento|Paciente|Hoje/i,
    covers: ['UAT-TEC-01'],
  },
  {
    id: 'UAT-TEC-02-prontuario-contextual',
    profile: 'NURSE_TECHNICIAN',
    path: '/medical-records',
    mode: 'allowed',
    expectedText: /Prontu|Paciente|Atendimento/i,
    covers: ['UAT-TEC-02'],
  },
  {
    id: 'UAT-TEC-03-bloqueio-recepcao-administrativa',
    profile: 'NURSE_TECHNICIAN',
    path: '/reception/triage',
    mode: 'blocked',
    covers: ['UAT-TEC-03'],
  },
  {
    id: 'UAT-TEC-04-conexao-pec-propria',
    profile: 'NURSE_TECHNICIAN',
    path: '/minha-conexao-pec',
    mode: 'allowed',
    expectedText: /PEC|e-SUS|Conex|Vinculo|Credencial/i,
    covers: ['UAT-TEC-04'],
  },
  {
    id: 'UAT-NM-01-02-plantoes',
    profile: 'NURSE_MANAGER',
    path: '/duties',
    mode: 'allowed',
    expectedText: /Plant|Turno|Profissional|Setor/i,
    covers: ['UAT-NM-01', 'UAT-NM-02', 'UAT-NM-03'],
  },
  {
    id: 'UAT-DOC-01-consultas',
    profile: 'DOCTOR',
    path: '/consultations',
    mode: 'allowed',
    expectedText: /Consulta|Atendimento|Paciente/i,
    covers: ['UAT-DOC-01'],
  },
  {
    id: 'UAT-DOC-02-03-prontuario-prescricao',
    profile: 'DOCTOR',
    path: '/medical-records',
    mode: 'allowed',
    expectedText: /Prontu|Prescri|Evolu|Paciente/i,
    covers: ['UAT-DOC-02', 'UAT-DOC-03'],
  },
  {
    id: 'UAT-DOC-05-revisao-noturna',
    profile: 'DOCTOR',
    path: '/night-shift-review',
    mode: 'allowed',
    expectedText: /Revis|Noturna|Pend|Plant/i,
    covers: ['UAT-DOC-05'],
  },
  {
    id: 'UAT-PHA-01-fila-farmacia',
    profile: 'PHARMACIST',
    path: '/pharmacy',
    mode: 'allowed',
    expectedText: /Farm|Prescri|Dispensa|Estoque/i,
    covers: ['UAT-PHA-01', 'UAT-PHA-02', 'UAT-PHA-03', 'UAT-PHA-04'],
  },
  {
    id: 'UAT-PHA-05-lme-pendencias-externas',
    profile: 'PHARMACIST',
    path: '/lme-ceaf',
    mode: 'allowed',
    expectedText: /LME|CEAF|Medicamento|Solicita/i,
    covers: ['UAT-PHA-05'],
  },
  {
    id: 'UAT-HM-01-dashboard-kpis',
    profile: 'HOSPITAL_MANAGER',
    path: '/gestora-dashboard',
    mode: 'allowed',
    expectedText: /Dashboard|Gest|Indicador|Atendimento/i,
    covers: ['UAT-HM-01'],
  },
  {
    id: 'UAT-HM-02-bloqueio-prontuario',
    profile: 'HOSPITAL_MANAGER',
    path: '/medical-records',
    mode: 'blocked',
    covers: ['UAT-HM-02'],
  },
  {
    id: 'UAT-HM-03-leitos-internacao',
    profile: 'HOSPITAL_MANAGER',
    path: '/admissions',
    mode: 'allowed',
    expectedText: /Interna|Leito|Paciente|Admiss/i,
    covers: ['UAT-HM-03'],
  },
  {
    id: 'UAT-HM-acessos-externos',
    profile: 'HOSPITAL_MANAGER',
    path: '/users',
    mode: 'allowed',
    expectedText: /Usu|Acesso|e-SUS PEC|Pré-cadastrado|Aprovar/i,
    covers: ['UAT-HM-01'],
  },
  {
    id: 'UAT-FIN-01-faturamento',
    profile: 'FINANCE',
    path: '/billing',
    mode: 'allowed',
    expectedText: /Fatur|Cobran|Finance|Conta/i,
    covers: ['UAT-FIN-01'],
  },
  {
    id: 'UAT-FIN-02-bloqueio-clinico',
    profile: 'FINANCE',
    path: '/medical-records',
    mode: 'blocked',
    covers: ['UAT-FIN-02'],
  },
  {
    id: 'UAT-ADM-01-usuarios',
    profile: 'ADMIN',
    path: '/users',
    mode: 'allowed',
    expectedText: /Usu|Profissional|Perfil|Acesso/i,
    covers: ['UAT-ADM-01'],
  },
  {
    id: 'UAT-ADM-01-equipe',
    profile: 'ADMIN',
    path: '/staff',
    mode: 'allowed',
    expectedText: /Equipe|Profissional|Cargo|Perfil/i,
    covers: ['UAT-ADM-01'],
  },
  {
    id: 'UAT-ADM-02-suporte-controlado-prontuario',
    profile: 'ADMIN',
    path: '/medical-records',
    mode: 'allowed',
    expectedText: /Prontu|Paciente|Atendimento|Evolu/i,
    covers: ['UAT-ADM-02'],
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
  return `10.88.0.${hash + 20}`;
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

async function showSceneSlate(page: Page, scene: UatScene) {
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
            width: min(900px, calc(100vw - 64px));
            border: 1px solid #334155;
            border-radius: 8px;
            padding: 40px;
            background: #111827;
          }
          p { margin: 0 0 8px; color: #cbd5e1; font-size: 20px; line-height: 1.55; }
          h1 { margin: 10px 0 18px; font-size: 34px; line-height: 1.15; }
          strong { color: #facc15; }
        </style>
      </head>
      <body>
        <main>
          <p>Preparando cena UAT visual</p>
          <h1>${scene.id}</h1>
          <p>Perfil: <strong>${scene.profile}</strong></p>
          <p>Destino: <strong>${scene.path}</strong></p>
          <p>Modo esperado: <strong>${scene.mode}</strong></p>
          <p>Casos cobertos: <strong>${scene.covers.join(', ')}</strong></p>
        </main>
      </body>
    </html>
  `);
  await page.waitForTimeout(sceneSlateMs);
}

async function showSceneBadge(page: Page, scene: UatScene) {
  await page.evaluate(({ id, profile, mode }) => {
    document.querySelector('[data-video-scene-badge]')?.remove();
    const badge = document.createElement('div');
    badge.dataset.videoSceneBadge = 'true';
    badge.textContent = `${id} | ${profile} | ${mode}`;
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

async function openNavigationGroups(page: Page) {
  for (const group of ['Atendimento', 'Hospitalização', 'Exames', 'Medicamentos', 'Financeiro', 'Gestão']) {
    const trigger = page.getByRole('button', { name: group }).first();
    if ((await trigger.count()) === 0) continue;
    if ((await trigger.getAttribute('aria-expanded')) === 'false') {
      await clickWithPerception(page, trigger, `Expandindo grupo lateral: ${group}`);
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
      await humanPause(page, 0.5);
    }
  }
}

test.describe('Professional UAT assisted visual evidence', () => {
  const sessions = new Map<string, AuthSession>();

  test.beforeAll(async () => {
    const api = await request.newContext({ baseURL: apiBaseURL });

    for (const [profile, credentials] of Object.entries(credentialsByProfile)) {
      sessions.set(profile, await login(api, credentials.login, credentials.password));
    }

    await api.dispose();
  });

  for (const scene of scenes) {
    test(`${scene.id} - ${scene.profile} - ${scene.covers.join(',')}`, async ({ page }) => {
      const session = sessions.get(scene.profile);
      expect(session, `${scene.profile} deve ter sessão autenticada`).toBeTruthy();

      await authenticatePage(page, session!);
      await showSceneSlate(page, scene);
      await page.goto(scene.path);
      await expect(page.locator('body')).toBeVisible();
      await page.waitForLoadState('networkidle').catch(() => undefined);
      await humanPause(page);

      if (scene.mode === 'blocked') {
        await expect(page, `${scene.id} deve bloquear ${scene.path}`).toHaveURL(/\/unauthorized$/);
        await showSceneBadge(page, scene);
        await pointToMainContent(page, `Bloqueio confirmado para ${scene.profile}: acesso redirecionado para tela nao autorizada.`);
        await humanPause(page, 1.5);
      } else {
        await expect(page).not.toHaveURL(/\/auth$/);
        await expect(page).not.toHaveURL(/\/unauthorized$/);
        await openNavigationGroups(page);
        await showSceneBadge(page, scene);
        if (scene.expectedText) {
          await expect(page.locator('body')).toContainText(scene.expectedText);
        }
        await pointToMainContent(page, `Cena carregada: ${scene.id}. Superficie permitida para ${scene.profile}.`);
        await settlePerceptualLayer(page, `Validacao visual concluida: ${scene.id}`);
        await humanPause(page, 1.5);
      }

      await page.screenshot({ path: test.info().outputPath(`${scene.id}.png`), fullPage: true });
    });
  }
});
