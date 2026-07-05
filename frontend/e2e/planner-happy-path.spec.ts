import { expect, test } from "@playwright/test";

// End-to-end happy path against the seeded Docker stack:
//   1. First visit redirects "/" -> "/planner" and opens the greeting modal.
//   2. Pick admission year 2025 + a cohort-tagged major (Software Engineering).
//   3. The catalog then renders real, backend-seeded courses.
//
// Determinism comes from docker-compose.e2e.yml: Google Sheets sync is off and
// a fixture majors.csv (e2e/fixtures/majors.csv) is mounted so majors carry a
// 2025 cohort year — the committed backend/majors.csv has no cohort suffix, so
// its majors get cohortYear 0 and never appear in the year-filtered greeting.
test("greeting -> seeded catalog", async ({ page }) => {
  // Start from a clean slate so the greeting modal is guaranteed to show.
  await page.addInitScript(() => window.localStorage.clear());

  await page.goto("/");
  await expect(page).toHaveURL(/\/planner$/);

  const greeting = page.getByRole("dialog");
  await expect(greeting.getByText("Привет!")).toBeVisible();

  // Radix Select: trigger renders role="combobox", options render role="option"
  // in a portal. Year is the first combobox, major the second.
  await greeting.getByRole("combobox").first().click();
  await page.getByRole("option", { name: "2025", exact: true }).click();

  await greeting.getByRole("combobox").nth(1).click();
  await page.getByRole("option", { name: "Software Engineering" }).click();

  await greeting.getByRole("button", { name: "Продолжить" }).click();
  await expect(greeting).toBeHidden();

  // Navigate to the catalog (client-side nav, greeting state persists) and
  // assert a known CSV-seeded course renders — proves real backend data flowed
  // through nginx -> backend -> the app.
  await page.getByRole("button", { name: "Каталог" }).click();
  await expect(page).toHaveURL(/\/catalog$/);

  await expect(page.getByText("Базы данных", { exact: true })).toBeVisible();
});
