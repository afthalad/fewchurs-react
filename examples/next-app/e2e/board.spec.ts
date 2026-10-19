import { expect, test } from "@playwright/test";

test("renders the board on the server", async ({ page }) => {
  const response = await page.goto("/feedback");
  const html = (await response?.text()) ?? "";

  // Server-rendered, not fetched after hydration: the markup itself holds the board.
  expect(html).toContain("fewchurs");
  expect(html).not.toContain("fr_live_");
});

test("keeps the API key out of every client asset", async ({ page }) => {
  const scripts: string[] = [];
  page.on("response", async (response) => {
    if (response.url().endsWith(".js")) scripts.push(await response.text().catch(() => ""));
  });

  await page.goto("/feedback");
  await page.waitForLoadState("networkidle");

  expect(scripts.some((script) => script.includes("fr_live_"))).toBe(false);
});

test("sets an httpOnly device cookie on the first interaction", async ({ page, context }) => {
  await page.goto("/feedback");
  await page.getByRole("button", { name: /Upvote/ }).first().click();

  const cookie = (await context.cookies()).find((candidate) => candidate.name === "fewchurs_did");
  expect(cookie?.httpOnly).toBe(true);
});

test("submits a request through the route handler", async ({ page }) => {
  await page.goto("/feedback");
  await page.getByRole("button", { name: "New request" }).click();
  await page.getByLabel("Title").fill("Playwright wrote this");
  await page.getByRole("button", { name: "Submit request" }).click();

  await expect(page.getByText("Thanks — your request is in.")).toBeVisible();
});
