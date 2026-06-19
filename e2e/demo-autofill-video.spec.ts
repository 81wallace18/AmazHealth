import { expect, test } from '@playwright/test';
import { clickWithPerception, focusLocator, pointToMainContent, settlePerceptualLayer } from './video-perception';

const humanDelayMs = Number(process.env.E2E_VIDEO_HUMAN_DELAY_MS || 1600);

const pickerUsers = [
  {
    login: 'recepcao.uat@hospital.com',
    fullName: 'UAT Recepcionista',
    organizationName: 'UBS Serra Pelada',
    initials: 'UR',
    password: 'Recepcao123!',
  },
  {
    login: 'gestor.hosp.uat@hospital.com',
    fullName: 'UAT Gestor Hospitalar',
    organizationName: 'UBS Serra Pelada',
    initials: 'UH',
    password: 'GestorHosp123!',
  },
  {
    login: 'enfermeiro.uat@hospital.com',
    fullName: 'Equipe Clínica',
    organizationName: 'UBS Serra Pelada',
    initials: 'EC',
    password: 'Enfermeiro123!',
  },
  {
    login: 'lucio.junior.uat@hospital.com',
    fullName: 'Lucio Junior',
    organizationName: 'UBS Serra Pelada',
    initials: 'LJ',
    password: 'Medico123!',
  },
  {
    login: 'medico.uat@hospital.com',
    fullName: 'UAT Medico',
    organizationName: 'UBS Serra Pelada',
    initials: 'UM',
    password: 'Medico123!',
  },
  {
    login: 'bruno.zuqueto.uat@hospital.com',
    fullName: 'Bruno Zuqueto',
    organizationName: 'UBS Serra Pelada',
    initials: 'BZ',
    password: 'Medico123!',
  },
  {
    login: 'leidiana.alvez.uat@hospital.com',
    fullName: 'Leidiana Alvez',
    organizationName: 'UBS Serra Pelada',
    initials: 'LA',
    password: 'Enfermeiro123!',
  },
];

async function humanPause(multiplier = 1) {
  await new Promise((resolve) => setTimeout(resolve, Math.max(0, Math.round(humanDelayMs * multiplier))));
}

test.describe('Video do preenchimento exemplo em modo demonstracao', () => {
  test('mostra picker, preserva demo apos login e preenche cadastro de paciente', async ({ page }) => {
    await page.addInitScript((users) => {
      window.localStorage.setItem(
        'amazhealth_known_users',
        JSON.stringify(
          users.map((user, index) => ({
            login: user.login,
            provider: 'LOCAL',
            fullName: user.fullName,
            organizationName: user.organizationName,
            initials: user.initials,
            lastLoginAt: Date.now() - index,
          }))
        )
      );
    }, pickerUsers);

    await page.goto('/?demo=1&demoRunId=video-overview');

    await expect(page).toHaveURL(/\/auth\?demo=1&demoRunId=video-overview/);
    await expect(page.getByRole('heading', { name: 'Quem está usando?' })).toBeVisible();
    await expect(page.getByText('UAT Recepcionista')).toBeVisible();
    await expect(page.getByText('UAT Gestor Hospitalar')).toBeVisible();
    await expect(page.getByText('Equipe Clínica')).toBeVisible();
    await pointToMainContent(page, 'Picker com os usuarios da UBS Serra Pelada. O modo demo veio pela URL e sera preservado apos o login.');
    await humanPause(1.2);

    await clickWithPerception(
      page,
      page.getByRole('button', { name: 'Selecionar usuário UAT Recepcionista' }),
      'Selecionar o perfil UAT Recepcionista.'
    );
    await page.getByLabel('Senha').fill(pickerUsers[0].password);
    await focusLocator(page, page.getByLabel('Senha'), 'Senha informada pelo apresentador, sem preencher automaticamente no produto.');
    await humanPause();
    await clickWithPerception(page, page.getByRole('button', { name: 'Entrar' }), 'Entrar como recepcionista para abrir um formulario real.');

    await expect(page).not.toHaveURL(/\/auth|\/unauthorized/);
    await expect(page.getByText('Modo demonstracao')).toBeVisible();
    await settlePerceptualLayer(page, 'Modo demonstracao continuou ativo depois do login.');
    await humanPause();

    await page.goto('/reception/triage');
    await expect(page).not.toHaveURL(/\/unauthorized|\/auth/);
    await expect(page.getByText('Modo demonstracao')).toBeVisible();
    await expect(page.getByRole('button', { name: /Novo Atendimento/i })).toBeVisible();
    await pointToMainContent(page, 'Recepcao: abrindo cadastro de novo atendimento.');
    await humanPause();

    await clickWithPerception(page, page.getByRole('button', { name: /Novo Atendimento/i }), 'Abrir o formulario de cadastro do paciente.');
    const autofillButton = page.getByRole('button', { name: 'Preencher exemplo de paciente' });
    await expect(autofillButton).toBeVisible();
    await focusLocator(page, autofillButton, 'Botao Preencher exemplo visivel dentro do formulario.');
    await humanPause();
    await clickWithPerception(page, autofillButton, 'Preencher o formulario com dados ficticios para acelerar a narracao.');

    await expect(page.locator('#fullName')).toHaveValue(/Paciente Demo/i);
    await expect(page.locator('#motherName')).toHaveValue(/Maria Demo/i);
    await expect(page.locator('#dateOfBirth')).toHaveValue('1988-04-12');
    await expect(page.locator('#address')).toHaveValue(/Serra Pelada/i);
    await focusLocator(page, page.locator('#fullName'), 'Campos principais preenchidos. O apresentador ainda decide se envia ou edita.');
    await humanPause(1.5);

    await page.screenshot({ path: test.info().outputPath('demo-autofill-recepcao-preenchido.png'), fullPage: true });

    await clickWithPerception(
      page,
      page.getByRole('button', { name: 'Cadastrar e Abrir Atendimento' }),
      'Enviar manualmente o cadastro para validar que o exemplo e aceito pelo backend.'
    );
    await expect(page.getByRole('heading', { name: 'Abrir Atendimento' })).toBeVisible();
    await expect(page.getByText(/Paciente Demo/i)).toBeVisible();
    await settlePerceptualLayer(page, 'Paciente cadastrado. O sistema abriu a etapa de atendimento.');
    await humanPause(1.5);
  });
});
