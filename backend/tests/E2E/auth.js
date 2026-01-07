const { test, expect } = require("@playwright/test");

test("User can login with valid credentials", async ({ page }) => {

  await page.goto("http://localhost:3000/login");

  await page.fill('input[name="email"]', "test@test.com");
  await page.fill('input[name="password"]', "password123");

  await page.click('button[type="submit"]');

  await expect(page).toHaveURL(/dashboard/);
  await expect(page.locator("text=Welcome")).toBeVisible();

});
