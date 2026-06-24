import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test("dashboard redirects from root", async ({ page }) => {
    await page.goto("/");
    // Should redirect to /dashboard which then redirects to /login if not authed
    await page.waitForTimeout(3000);
    expect(page.url()).toContain("login");
  });

  test("all public routes are accessible", async ({ page }) => {
    const routes = ["/login"];
    for (const route of routes) {
      await page.goto(route);
      await page.waitForTimeout(1000);
      // Should not crash (no error page)
      const bodyText = await page.locator("body").textContent();
      expect(bodyText).not.toContain("ERROR");
      expect(bodyText).not.toContain("error");
    }
  });

  test("protected routes redirect unauthenticated users", async ({ page }) => {
    const protectedRoutes = [
      "/dashboard",
      "/patients",
      "/patients/new",
      "/controls",
      "/treatments",
      "/reports",
      "/alerts",
      "/users",
      "/settings",
    ];
    for (const route of protectedRoutes) {
      await page.goto(route);
      await page.waitForTimeout(2000);
      expect(page.url()).toContain("login");
    }
  });
});
