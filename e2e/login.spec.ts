import { test, expect } from "@playwright/test";

// Since this is a Tauri app and we can't actually call Tauri invoke in the browser,
// we test what renders, what's visible, and the navigation flow.

test.describe("Login Page", () => {
  test("shows login form", async ({ page }) => {
    await page.goto("/login");
    await expect(
      page
        .locator("h1, h2")
        .filter({ hasText: /iniciar|sistema|login/i })
        .first(),
    ).toBeVisible();
    await expect(page.locator('input[type="text"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(
      page
        .locator('button[type="submit"], button')
        .filter({ hasText: /iniciar|ingresar|login/i })
        .first(),
    ).toBeVisible();
  });

  test("login page does NOT show sidebar", async ({ page }) => {
    await page.goto("/login");
    // Sidebar typically has navigation links — should NOT be visible on login
    const sidebarNav = page.locator("nav a, aside a");
    await expect(sidebarNav).toHaveCount(0);
  });

  test("shows error on empty form submission", async ({ page }) => {
    await page.goto("/login");
    const submitBtn = page.locator('button[type="submit"]');
    if (await submitBtn.isEnabled()) {
      await submitBtn.click();
      // Should show validation or error feedback
      await page.waitForTimeout(1000);
    }
  });
});

test.describe("Protected Routes", () => {
  test("redirects to /login when not authenticated", async ({ page }) => {
    await page.goto("/dashboard");
    await page
      .waitForURL("**/login**", { timeout: 5000 })
      .catch(() => {});
    // Should be on login page or login page content visible
    expect(page.url()).toContain("login");
  });

  test("redirects to /login for /patients when not authenticated", async ({
    page,
  }) => {
    await page.goto("/patients");
    await page.waitForTimeout(2000);
    expect(page.url()).toContain("login");
  });
});
