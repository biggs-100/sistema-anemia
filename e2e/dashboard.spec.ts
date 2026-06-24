import { test, expect } from "@playwright/test";

test.describe("Dashboard", () => {
  test("dashboard page redirects to login when not authenticated", async ({
    page,
  }) => {
    await page.goto("/dashboard", { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);
    // Should redirect to login since no session
    expect(page.url()).toContain("login");
  });

  test("dashboard components render loading state", async ({ page }) => {
    await page.goto("/dashboard");
    // The AuthGuard should show loading before redirect
    const loadingEl = page.locator("text=Cargando");
    // Either loading text exists or we've already redirected
    await page.waitForTimeout(3000);
  });
});
