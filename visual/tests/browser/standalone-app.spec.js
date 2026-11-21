import { test, expect } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LocalDaemon } from '../../packages/local-daemon/src/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../..');

test('Standalone React SDD app loads directly without token, navigates views, switches themes, and stays responsive', async ({ page }) => {
  const daemon = new LocalDaemon({ port: 0, pollIntervalMs: 60000 });
  daemon.registerProject(repoRoot);
  const info = await daemon.start();
  const consoleErrors = [];
  page.on('pageerror', (err) => consoleErrors.push(err.message));

  try {
    await page.goto(info.url, { waitUntil: 'networkidle' });
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByText('Task execution matrix, one square per spec task')).toBeVisible();

    // Accessible data table toggle
    await page.getByRole('button', { name: /Show data table/i }).first().click();
    await expect(page.getByRole('button', { name: /Hide data table/i }).first()).toBeVisible();

    // Navigate to Agent Telemetry view
    await page.getByRole('button', { name: /03\s*Agent Telemetry/i }).first().click();
    await expect(page.getByRole('heading', { name: /Agent & Cost Telemetry/i })).toBeVisible();

    // Navigate to Phases & Specs view
    await page.getByRole('button', { name: /02\s*Phases & Specs/i }).first().click();
    await expect(page.getByRole('button', { name: 'requirements', exact: true })).toBeVisible();

    // Control panel + Night Edition dark theme switch
    await page.getByRole('button', { name: /Control panel/i }).click();
    await page.getByRole('button', { name: /Night Edition/i }).click();
    expect(await page.evaluate(() => document.documentElement.getAttribute('data-theme'))).toBe('night-edition');
    await page.getByRole('button', { name: /Close control panel/i }).click();

    // Responsive zero horizontal overflow across mobile, tablet, desktop
    for (const width of [375, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(1);
    }

    expect(consoleErrors).toEqual([]);
  } finally {
    await daemon.stop();
  }
});
