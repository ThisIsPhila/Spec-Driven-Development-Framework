import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { LocalDaemon } from '../../packages/local-daemon/src/index.js';

test('Landing page renders without CLI commands, launches interactive demo, imports .sdd/ folder in browser, and stays responsive', async ({ page }) => {
  // Start daemon with 0 registered projects to simulate hosted/disconnected signed-out experience
  const daemon = new LocalDaemon({ port: 0, pollIntervalMs: 60000 });
  const info = await daemon.start();
  const consoleErrors = [];
  page.on('pageerror', (err) => consoleErrors.push(err.message));

  const tempRepo = fs.mkdtempSync(path.join(os.tmpdir(), 'sdd-browser-folder-'));
  const phaseDir = path.join(tempRepo, '.sdd', 'specs', 'active', 'phase-001-cloud-import');
  fs.mkdirSync(phaseDir, { recursive: true });
  fs.writeFileSync(path.join(tempRepo, '.sdd', 'constitution.md'), '# Browser Test Constitution\n');
  fs.writeFileSync(
    path.join(phaseDir, 'requirements.md'),
    '# Phase 001 — Browser Imported Project\n**Status:** APPROVED\n### REQ-1.1: Zero-CLI Import\n',
  );
  fs.writeFileSync(
    path.join(phaseDir, 'tasks.md'),
    '# Tasks\n- [x] **[T001.1]** Parse folder directly in browser (REQ-1.1)\n- [ ] **[T001.2]** Verify reload persistence (REQ-1.1)\n',
  );

  try {
    await page.goto(info.url, { waitUntil: 'networkidle' });

    // 1. Editorial Product Landing Page shown by default
    await expect(page.getByRole('heading', { name: /Specs before code/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Try Interactive Demo/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Connect Project/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Sign In \/ Create Cloud Account/i })).toBeVisible();

    // Local CLI disclosure starts collapsed
    const cliToggle = page.getByRole('button', { name: /Local CLI \(Optional/i });
    await expect(cliToggle).toHaveAttribute('aria-expanded', 'false');
    await cliToggle.click();
    await expect(cliToggle).toHaveAttribute('aria-expanded', 'true');
    await cliToggle.click();

    // Responsive check on LandingView across 375px - 1440px
    for (const width of [375, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, `LandingView horizontal overflow at ${width}px`).toBeLessThanOrEqual(1);
    }

    // 2. Launch Interactive Demo (zero CLI)
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.getByRole('button', { name: /Try Interactive Demo/i }).click();
    await expect(page.getByRole('heading', { name: /Cloud Billing Service \(Demo\)/i })).toBeVisible();

    // Check Telemetry & Phases in Demo
    await page.getByRole('button', { name: /03\s*Agent Telemetry/i }).first().click();
    await expect(page.getByRole('heading', { name: /Agent & Cost Telemetry/i })).toBeVisible();
    await expect(page.getByText('claude-sonnet-5.5').first()).toBeVisible();

    // 3. Top-left SDD brand button returns to LandingView
    await page.getByRole('button', { name: /SDD Home/i }).click();
    await expect(page.getByRole('heading', { name: /Specs before code/i })).toBeVisible();

    // 4. Open Connect Project modal and inspect GitHub tab + Folder Import
    await page.getByRole('button', { name: /Connect Project/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Check GitHub tab UI
    await page.getByRole('button', { name: /GitHub Repo/i }).click();
    await expect(page.getByPlaceholder(/ThisIsPhila\/Spec-Driven-Development-Framework/i)).toBeVisible();

    // Switch to Local .sdd/ Folder tab and upload folder via webkitdirectory input
    await page.getByRole('button', { name: /Local \.sdd\/ Folder/i }).click();
    await page.getByTestId('folder-file-input').setInputFiles(tempRepo);

    // Imported project loads directly into OverviewView
    await expect(page.getByRole('heading', { name: path.basename(tempRepo) })).toBeVisible();
    await expect(page.getByText(/1 of 2 tasks complete across 1 phases/i)).toBeVisible();

    // Persists across reload via IndexedDB/localStorage
    await page.reload({ waitUntil: 'networkidle' });
    await expect(page.getByRole('heading', { name: path.basename(tempRepo) })).toBeVisible();

    expect(consoleErrors).toEqual([]);
  } finally {
    await daemon.stop();
    fs.rmSync(tempRepo, { recursive: true, force: true });
  }
});
