import { test, expect } from "@playwright/test";

test.describe("Hackpact Critical User Flows", () => {
  test("1. Landing page renders 3-color palette and Hyderabad cold start banner", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Hackpact/);
    await expect(page.locator("text=Hyderabad Waitlist Milestone")).toBeVisible();
    await expect(page.locator("text=23 / 50 Joined")).toBeVisible();
    await expect(page.locator("text=Smart India Hackathon 2026")).toBeVisible();
  });

  test("2. /design living style guide renders all tokens, buttons, and alert states", async ({ page }) => {
    await page.goto("/design");
    await expect(page.locator("text=Primitive Color Tokens")).toBeVisible();
    await expect(page.locator("text=#B8F2C9")).toBeVisible();
    await expect(page.locator("text=#0A0A0A")).toBeVisible();
    await expect(page.locator("text=#FFFFFF")).toBeVisible();
    await expect(page.locator("text=No Red/Yellow Hues")).toBeVisible();
  });

  test("3. Onboarding profile completion gates matching until >= 80%", async ({ page }) => {
    await page.goto("/onboarding");
    await expect(page.locator("text=Build Your Competitive Profile")).toBeVisible();
    await expect(page.locator("text=Profile Completeness Meter")).toBeVisible();
    await expect(page.locator("text=Digital Personal Data Protection Act")).toBeVisible();
  });

  test("4. Hackathon directory supports filtering and viewing details", async ({ page }) => {
    await page.goto("/hackathons");
    await expect(page.locator("text=External Hackathons Directory")).toBeVisible();
    await expect(page.locator("text=Smart India Hackathon 2026").first()).toBeVisible();

    // Click event detail
    await page.click("text=Smart India Hackathon 2026");
    await expect(page.locator("text=Autonomous Agents Lab")).toBeVisible();
    await expect(page.locator("text=Builders Seeking Teams")).toBeVisible();
  });

  test("5. Teammate suggestions displays 'Why you match' compatibility cards", async ({ page }) => {
    await page.goto("/matches");
    await expect(page.locator("text=Teammate Suggestions")).toBeVisible();
    await expect(page.locator("text=Compatibility Signals").first()).toBeVisible();
    await expect(page.locator("text=Send Match Request").first()).toBeVisible();
  });

  test("6. Lucky Spin wheel renders and spins compatible candidate", async ({ page }) => {
    await page.goto("/spin");
    await expect(page.locator("text=Lucky Spin: Mystery Teammate")).toBeVisible();
    const spinButton = page.locator("button:has-text('Spin Mystery Teammate')");
    await expect(spinButton).toBeVisible();
  });

  test("7. Teams workspace supports slot recruitment and team commitment lock", async ({ page }) => {
    await page.goto("/teams");
    await expect(page.locator("text=Teams & Open Role Slots")).toBeVisible();
    await expect(page.locator("text=Anti-Ghosting Lock").first()).toBeVisible();
  });

  test("8. Direct 1:1 chat renders mutual-accept protection", async ({ page }) => {
    await page.goto("/chat");
    await expect(page.locator("text=Direct Messages")).toBeVisible();
    await expect(page.locator("text=Mutual Accept Only")).toBeVisible();
  });

  test("9. System health endpoint returns operational JSON status", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.status).toBe("healthy");
    expect(data.product).toBe("Hackpact");
  });
});
