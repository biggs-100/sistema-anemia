import { test as base, expect, Page } from "@playwright/test";

// Mock Tauri invoke responses
export async function mockTauriInvoke(
  page: Page,
  _responseMap: Record<string, unknown>,
) {
  await page.addInitScript(() => {
    window.__TAURI_INTERNALS__ = {
      invoke: (_cmd: string, _args?: unknown) => {
        // Will be handled by page.route or we override at test level
      },
    };
  });
}

// Convenience: wait for network idle + render
export async function waitForPage(page: Page) {
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(500);
}

export { base as test, expect };
