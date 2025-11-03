import { test, expect } from "@playwright/test";

test("dashboard loads seed data", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("株価分析と見通し")).toBeVisible();
  await expect(page.getByText("Project TickerVista")).toBeVisible();
  await expect(page.getByText("初心者のための指標辞書")).toBeVisible();
});
