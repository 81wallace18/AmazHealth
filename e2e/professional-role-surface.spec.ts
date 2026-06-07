import { expect, request, test, type APIRequestContext, type Page } from '@playwright/test';

const apiBaseURL = `${process.env.E2E_BACKEND_URL || 'http://127.0.0.1:8080/api/v1'}/`.replace(/\/+$/, '/');

type AuthSession = {
  accessToken: string;
  user: Record<string, unknown>;
};

type Profile = {
  label: string;
  login: string;
  password: string;
  visibleLinks: string[];
  hiddenLinks: string[];
  allowedRoutes: string[];
  blockedRoutes: string[];
};

const profiles: Profile[] = [
  {
    label: 'RECEPTIONIST',
    login: 'recepcao.uat@hospital.com',
    password: 'Recepcao123!',
    visibleLinks: ['/', '/daily-attendances', '/patients', '/reception/triage'],
    hiddenLinks: ['/triage', '/medical-records', '/pharmacy', '/billing'],
    allowedRoutes: ['/reception/triage', '/daily-attendances'],
    blockedRoutes: ['/triage', '/medical-records'],
  },
  {
    label: 'NURSE',
    login: 'enfermeiro.uat@hospital.com',
    password: 'Enfermeiro123!',
    visibleLinks: ['/', '/daily-attendances', '/patients', '/triage', '/reception/triage', '/medical-records'],
    hiddenLinks: ['/consultations', '/billing', '/pharmacy'],
    allowedRoutes: ['/triage', '/reception/triage', '/medical-records'],
    blockedRoutes: ['/billing'],
  },
  {
    label: 'NURSE_TECHNICIAN',
    login: 'tecnico.enf.uat@hospital.com',
    password: 'Tecnico123!',
    visibleLinks: ['/', '/daily-attendances', '/patients', '/triage', '/medical-records'],
    hiddenLinks: ['/reception/triage', '/consultations', '/billing', '/pharmacy'],
    allowedRoutes: ['/daily-attendances', '/triage', '/medical-records'],
    blockedRoutes: ['/reception/triage', '/billing'],
  },
  {
    label: 'DOCTOR',
    login: 'medico.uat@hospital.com',
    password: 'Medico123!',
    visibleLinks: ['/', '/daily-attendances', '/patients', '/triage', '/medical-records', '/consultations'],
    hiddenLinks: ['/reception/triage', '/billing', '/pharmacy'],
    allowedRoutes: ['/triage', '/medical-records', '/consultations'],
    blockedRoutes: ['/reception/triage', '/billing'],
  },
  {
    label: 'GESTAO',
    login: 'gestao.uat@hospital.com',
    password: 'Gestao123!',
    visibleLinks: ['/', '/daily-attendances', '/gestora-dashboard', '/reports'],
    hiddenLinks: ['/medical-records', '/triage', '/reception/triage', '/billing'],
    allowedRoutes: ['/daily-attendances', '/gestora-dashboard'],
    blockedRoutes: ['/medical-records', '/triage'],
  },
];

async function login(api: APIRequestContext, loginName: string, password: string): Promise<AuthSession> {
  const response = await api.post('auth/login', {
    data: { login: loginName, password },
  });
  if (!response.ok()) {
    throw new Error(`login ${loginName} retornou HTTP ${response.status()}: ${await response.text()}`);
  }
  return response.json();
}

async function authenticatePage(page: Page, session: AuthSession) {
  await page.addInitScript(({ accessToken, user }) => {
    window.localStorage.setItem('authStorageType', 'local');
    window.localStorage.setItem('accessToken', accessToken);
    window.localStorage.setItem('user', JSON.stringify(user));
  }, session);
}

function navLink(page: Page, href: string) {
  return page.locator(`a[href="${href}"]`);
}

async function openNavigationGroups(page: Page) {
  for (const group of ['Atendimento', 'Hospitalização', 'Exames', 'Medicamentos', 'Financeiro', 'Gestão']) {
    const trigger = page.getByRole('button', { name: group }).first();
    if ((await trigger.count()) === 0) continue;
    if ((await trigger.getAttribute('aria-expanded')) === 'false') {
      await trigger.click();
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    }
  }
}

async function expectVisibleLink(page: Page, profileLabel: string, href: string) {
  const count = await navLink(page, href).count();
  expect(count, `${profileLabel} deve ver ${href}`).toBeGreaterThan(0);
}

async function expectHiddenLink(page: Page, profileLabel: string, href: string) {
  await expect(navLink(page, href), `${profileLabel} nao deve ver ${href}`).toHaveCount(0);
}

async function expectAllowedRoute(page: Page, path: string) {
  await page.goto(path);
  await expect(page).not.toHaveURL(/\/unauthorized$/);
  await expect(page).not.toHaveURL(/\/auth$/);
}

async function expectBlockedRoute(page: Page, path: string) {
  await page.goto(path);
  await expect(page).toHaveURL(/\/unauthorized$/);
}

test.describe('Professional role surface - advanced permissions', () => {
  for (const profile of profiles) {
    test(`${profile.label} vê apenas navegação e rotas coerentes com a primeira onda`, async ({ page }) => {
      const api = await request.newContext({ baseURL: apiBaseURL });
      const session = await login(api, profile.login, profile.password);

      await authenticatePage(page, session);
      await page.goto('/');
      await expect(page.locator('body')).toBeVisible();
      await expect(navLink(page, '/').first()).toBeVisible();
      await openNavigationGroups(page);

      for (const href of profile.visibleLinks) {
        await expectVisibleLink(page, profile.label, href);
      }

      for (const href of profile.hiddenLinks) {
        await expectHiddenLink(page, profile.label, href);
      }

      for (const path of profile.allowedRoutes) {
        await expectAllowedRoute(page, path);
      }

      for (const path of profile.blockedRoutes) {
        await expectBlockedRoute(page, path);
      }

      await api.dispose();
    });
  }
});
