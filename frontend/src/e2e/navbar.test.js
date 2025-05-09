const { test, expect } = require("@playwright/test");

test("Navbar basic visibility and interactions", async ({ page }) => {
  // Go to homepage
  await page.goto("/");

  // 1. First verify all navbar elements are visible
  await expect(page.locator("nav")).toBeVisible();
  await expect(page.locator("nav").getByText("Stockify")).toBeVisible();
  await expect(page.locator("nav").getByText("Features")).toBeVisible();
  await expect(page.locator("nav").getByText("About")).toBeVisible();
  await expect(page.locator("nav").getByText("AI Help")).toBeVisible();
  await expect(
    page.locator("nav").getByRole("button", { name: "Login" })
  ).toBeVisible();
  await expect(
    page.locator("nav").getByRole("link", { name: "Sign Up" })
  ).toBeVisible();

  // 2. Test Features navigation
  await page.locator("nav").getByText("Features").click();
  await expect(
    page.getByRole("heading", { name: "Why Learn with Stockify?" })
  ).toBeVisible();

  // 3. Test Sign Up navigation
  await Promise.all([
    page.waitForURL("**/signup"),
    page.locator("nav").getByRole("link", { name: "Sign Up" }).click(),
  ]);

  // Verify we're on the signup page
  await expect(page.url()).toContain("/signup");
});
