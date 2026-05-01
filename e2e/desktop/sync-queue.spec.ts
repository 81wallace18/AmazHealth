import { test, expect } from '@playwright/test';

/**
 * E2E skeleton para os cenários C1–C9 do PLAN.md.
 *
 * Estes testes EXIGEM `tauri-driver` rodando contra um build do desktop.
 * Setup: https://v2.tauri.app/develop/tests/webdriver/
 *
 * Em CI normal (sem tauri-driver), este arquivo é skipado pela env var DESKTOP_E2E.
 */

const DESKTOP_E2E = process.env.DESKTOP_E2E === '1';

test.describe('Desktop sync — C1 fluxo offline completo', () => {
  test.skip(!DESKTOP_E2E, 'Requer tauri-driver e build do desktop');

  test('cria mutations offline e sincroniza ao reconectar', async ({ page }) => {
    // TODO: requer tauri-driver. Estrutura sugerida:
    // 1. Login normal pela UI
    // 2. Forçar offline via DevTools network throttling OU desconectar via Tauri command
    // 3. Criar atendimento + triagem + evolução + prescrição
    // 4. Verificar badges de pendente
    // 5. Religar
    // 6. Aguardar sync completo
    // 7. Validar no backend que tudo chegou
    test.skip(true, 'pendente: tauri-driver setup + cenário C1');
  });
});

test.describe('Desktop sync — C3 conflito entre máquinas', () => {
  test.skip(!DESKTOP_E2E, 'Requer 2 instâncias');
  test('máquina B recebe CONFLICT', async () => {
    test.skip(true, 'pendente: cenário multi-máquina');
  });
});

test.describe('Desktop sync — C7 wipe após senha errada', () => {
  test.skip(!DESKTOP_E2E, 'Requer tauri-driver');
  test('5 senhas erradas wipam o DB', async () => {
    test.skip(true, 'pendente: cenário C7');
  });
});

test.describe('Desktop sync — C8 update com mutations pendentes', () => {
  test.skip(!DESKTOP_E2E, 'Requer 2 versões publicadas');
  test('mutations PENDING preservadas após update', async () => {
    test.skip(true, 'pendente: cenário C8 com 2 builds');
  });
});
