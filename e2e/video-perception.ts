import { expect, type Locator, type Page } from '@playwright/test';

const cursorTransitionMs = Number(process.env.E2E_VIDEO_CURSOR_TRANSITION_MS || 650);

type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export async function installPerceptualLayer(page: Page) {
  await page.evaluate(() => {
    document.querySelectorAll('[data-video-perception-root], style[data-video-perception-root="style"]').forEach((node) => node.remove());

    const style = document.createElement('style');
    style.dataset.videoPerceptionRoot = 'style';
    style.textContent = `
      [data-video-perception-root] {
        position: fixed;
        inset: 0;
        z-index: 2147483646;
        pointer-events: none;
        font-family: Inter, Arial, sans-serif;
      }
      [data-video-cursor] {
        position: fixed;
        left: 50vw;
        top: 50vh;
        width: 30px;
        height: 34px;
        filter: drop-shadow(0 5px 10px rgba(15, 23, 42, 0.38));
        transform: translate(-4px, -2px);
        transition: left 650ms ease, top 650ms ease, transform 180ms ease;
      }
      [data-video-cursor] svg {
        display: block;
        width: 30px;
        height: 34px;
      }
      [data-video-cursor].pressing {
        transform: translate(-4px, -2px) scale(0.88);
      }
      [data-video-target] {
        position: fixed;
        border: 3px solid #2563eb;
        border-radius: 8px;
        box-shadow: 0 0 0 5px rgba(37, 99, 235, 0.13);
        transition: left 220ms ease, top 220ms ease, width 220ms ease, height 220ms ease, opacity 180ms ease;
      }
      [data-video-caption] {
        position: fixed;
        left: 50%;
        top: 24px;
        transform: translateX(-50%);
        max-width: min(920px, calc(100vw - 48px));
        padding: 12px 18px;
        border-radius: 8px;
        background: rgba(15, 23, 42, 0.94);
        color: #f8fafc;
        font-size: 18px;
        font-weight: 800;
        line-height: 1.35;
        text-align: center;
        box-shadow: 0 18px 42px rgba(15, 23, 42, 0.26);
      }
    `;

    const root = document.createElement('div');
    root.dataset.videoPerceptionRoot = 'true';

    const target = document.createElement('div');
    target.dataset.videoTarget = 'true';
    target.style.opacity = '0';

    const cursor = document.createElement('div');
    cursor.dataset.videoCursor = 'true';
    cursor.innerHTML = `
      <svg viewBox="0 0 30 34" aria-hidden="true">
        <path d="M3 2 L3 28 L10.5 21.2 L15.2 32 L20.8 29.5 L16 18.9 L26 18.9 Z" fill="#111827" stroke="#f8fafc" stroke-width="2" stroke-linejoin="round" />
      </svg>
    `;

    const caption = document.createElement('div');
    caption.dataset.videoCaption = 'true';
    caption.textContent = 'Preparando visualizacao';

    root.append(target, cursor, caption);
    document.head.appendChild(style);
    document.body.appendChild(root);
  });
}

export async function announce(page: Page, label: string) {
  await installPerceptualLayer(page);
  await page.evaluate((text) => {
    const caption = document.querySelector<HTMLElement>('[data-video-caption]');
    if (caption) caption.textContent = text;
  }, label);
}

export async function settlePerceptualLayer(page: Page, label: string) {
  await installPerceptualLayer(page);
  await page.evaluate((text) => {
    const caption = document.querySelector<HTMLElement>('[data-video-caption]');
    const target = document.querySelector<HTMLElement>('[data-video-target]');
    const cursor = document.querySelector<HTMLElement>('[data-video-cursor]');
    if (caption) caption.textContent = text;
    if (target) target.style.opacity = '0';
    cursor?.classList.remove('pressing');
  }, label);
}

export async function pointToMainContent(page: Page, label: string) {
  await installPerceptualLayer(page);
  const rect = await page.evaluate<Rect>(() => {
    const selectors = ['main', '[role="main"]', 'h1', 'h2', 'table', 'form', '[data-testid]', 'body'];
    for (const selector of selectors) {
      const element = document.querySelector<HTMLElement>(selector);
      if (!element) continue;
      const candidate = element.getBoundingClientRect();
      if (candidate.width > 80 && candidate.height > 32) {
        return {
          x: candidate.left,
          y: candidate.top,
          width: candidate.width,
          height: candidate.height,
        };
      }
    }
    return { x: 24, y: 96, width: window.innerWidth - 48, height: Math.min(420, window.innerHeight - 120) };
  });
  await movePointerToRect(page, rect, label, true);
}

export async function focusLocator(page: Page, locator: Locator, label: string) {
  await installPerceptualLayer(page);
  await locator.scrollIntoViewIfNeeded();
  await expect(locator).toBeVisible();

  const box = await locator.boundingBox();
  if (!box) {
    await announce(page, label);
    return;
  }

  await movePointerToRect(page, box, label, true);
}

export async function clickWithPerception(page: Page, locator: Locator, label: string) {
  await focusLocator(page, locator, label);
  await page.evaluate(() => {
    document.querySelector<HTMLElement>('[data-video-cursor]')?.classList.add('pressing');
  });
  await page.waitForTimeout(160);
  await locator.click();
  await page.evaluate(() => {
    document.querySelector<HTMLElement>('[data-video-cursor]')?.classList.remove('pressing');
  });
}

async function movePointerToRect(page: Page, rect: Rect, label: string, showTarget: boolean) {
  const padded = {
    x: Math.max(8, rect.x - 8),
    y: Math.max(8, rect.y - 8),
    width: Math.min(rect.width + 16, page.viewportSize()?.width || rect.width + 16),
    height: Math.min(rect.height + 16, page.viewportSize()?.height || rect.height + 16),
  };
  await page.evaluate(
    ({ targetRect, text, revealTarget }) => {
      const cursor = document.querySelector<HTMLElement>('[data-video-cursor]');
      const target = document.querySelector<HTMLElement>('[data-video-target]');
      const caption = document.querySelector<HTMLElement>('[data-video-caption]');
      if (caption) caption.textContent = text;
      if (cursor) {
        cursor.style.left = `${targetRect.x + targetRect.width / 2}px`;
        cursor.style.top = `${targetRect.y + targetRect.height / 2}px`;
      }
      if (target) {
        target.style.left = `${targetRect.x}px`;
        target.style.top = `${targetRect.y}px`;
        target.style.width = `${targetRect.width}px`;
        target.style.height = `${targetRect.height}px`;
        target.style.opacity = revealTarget ? '1' : '0';
      }
    },
    { targetRect: padded, text: label, revealTarget: showTarget }
  );
  await page.waitForTimeout(cursorTransitionMs);
}
