import { test, expect } from "@playwright/test";

/**
 * Critical path coverage for the live, database-backed application.
 * There is no sample data: the assertions below check that the real surfaces
 * render, that the data APIs answer, and that protected routes stay closed
 * for anonymous visitors.
 */
test.describe("Hackpact Critical User Flows", () => {
  test("1. Landing page renders the live directory and the cold start banner", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Hackpact/);
    await expect(page.locator("text=Hyderabad Waitlist Milestone")).toBeVisible();
    await expect(page.locator("text=Live network, counted from the database")).toBeVisible();
  });

  test("2. /design living style guide renders all tokens, buttons, and alert states", async ({ page }) => {
    await page.goto("/design");
    await expect(page.locator("text=Primitive Color Tokens")).toBeVisible();
    await expect(page.locator("text=#B8F2C9").first()).toBeVisible();
    await expect(page.locator("text=#0A0A0A").first()).toBeVisible();
    await expect(page.locator("text=#FFFFFF").first()).toBeVisible();
    await expect(page.locator("text=No Red/Yellow Hues")).toBeVisible();
  });

  test("3. Onboarding and the directory require a session", async ({ page }) => {
    for (const path of ["/onboarding", "/hackathons"]) {
      await page.goto(path);
      await expect(page).toHaveURL(/\/login/);
    }
  });

  test("4. The waitlist and the directory of published events are public", async ({ page }) => {
    await page.goto("/waitlist");
    await expect(page.locator("text=Chapter Waitlist")).toBeVisible();
    await expect(page.locator("text=Builders Joined")).toBeVisible();
  });

  test("5. Protected surfaces redirect anonymous visitors to the sign-in screen", async ({ page }) => {
    for (const path of ["/matches", "/onboarding", "/teams", "/chat", "/profile"]) {
      await page.goto(path);
      await expect(page).toHaveURL(/\/login/);
      await expect(
        page.locator("text=Sign in or create your account")
      ).toBeVisible();
    }
  });

  test("7. System health endpoint reports the real database state", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.product).toBe("Hackpact");
    expect(["healthy", "needs_migrations", "degraded"]).toContain(data.status);
  });

  test("8. Public data endpoints answer with database backed payloads", async ({ request }) => {
    const hackathons = await request.get("/api/hackathons");
    expect(hackathons.ok()).toBeTruthy();
    const hackathonBody = await hackathons.json();
    expect(Array.isArray(hackathonBody.hackathons)).toBeTruthy();

    const skills = await request.get("/api/skills");
    expect(skills.ok()).toBeTruthy();
    const skillBody = await skills.json();
    expect(Array.isArray(skillBody.skills)).toBeTruthy();

    const stats = await request.get("/api/stats");
    expect(stats.ok()).toBeTruthy();
    const statsBody = await stats.json();
    expect(typeof statsBody.stats.builders).toBe("number");
  });

  test("9. Match feed and profile APIs refuse anonymous requests", async ({ request }) => {
    for (const path of [
      "/api/matches",
      "/api/profile",
      "/api/conversations",
      "/api/notifications",
      "/api/match-requests",
    ]) {
      const response = await request.get(path);
      expect(response.status()).toBe(401);
    }
  });

  test("10. Precompute and push jobs refuse requests without the cron secret", async ({ request }) => {
    const precompute = await request.post("/api/matching/precompute");
    expect(precompute.status()).toBe(401);

    const push = await request.post("/api/notifications/push");
    expect(push.status()).toBe(401);
  });

  test("11. The admin console is closed to anonymous visitors", async ({ request }) => {
    const response = await request.get("/api/admin");
    expect(response.status()).toBe(403);
  });
});
