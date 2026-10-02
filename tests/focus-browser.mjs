import { createRequire } from "node:module";
import assert from "node:assert/strict";

const require = createRequire(import.meta.url);
const { chromium } = require("C:/Users/SARANYA/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const browser = await chromium.launch({
  headless: true,
  executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
});

try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("dialog", (dialog) => dialog.accept());

  await page.goto(process.env.REBOUND_URL || "http://127.0.0.1:4173");
  await page.getByText("Make time.").waitFor();
  await page.getByText("YOUR REBOUND WORLD").waitFor();
  await page.getByText("FOCUSTOWN · A REBOUND PLACE").waitFor();
  await page.getByRole("button", { name: "Moon Library" }).click();
  await page.getByRole("button", { name: "Start a 10-minute mission" }).click();
  assert.equal(await page.locator("#focusSubject").inputValue(), "Moon Library");
  assert.equal(await page.locator("#focusDuration").inputValue(), "10");
  await page.locator("#buddyPicker").selectOption("Fox");
  await page.getByRole("button", { name: "5-minute rescue" }).click();
  await page.getByRole("tab", { name: "Focus timer" }).waitFor();
  assert.equal(await page.locator("#focusSubject").inputValue(), "Quick review");
  assert.equal(await page.locator("#focusDuration").inputValue(), "5");
  await page.getByText("Focus history connected").waitFor();

  await page.getByRole("tab", { name: "Weekly timetable" }).click();
  await page.getByRole("button", { name: "Add Physics + Chemistry example" }).click();
  await page.locator("#weeklySchedule").getByText("Physics", { exact: true }).first().waitFor();
  await page.locator("#weeklySchedule").getByText("Chemistry", { exact: true }).first().waitFor();

  const calendarDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export calendar" }).click();
  assert.match((await calendarDownload).suggestedFilename(), /rebound-weekly-study\.ics/);

  await page.getByRole("tab", { name: "Focus timer" }).click();
  await page.locator("#focusDuration").fill("1");
  await page.getByRole("button", { name: "Start focus" }).click();
  await page.getByRole("button", { name: "End early" }).click();
  await page.getByText("Interrupted session saved.").waitFor();

  await page.getByRole("tab", { name: "Insights" }).click();
  await page.getByRole("heading", { name: "Session history" }).waitFor();
  assert.equal(await page.locator("#focusHistory tbody tr").count(), 1);

  await page.getByRole("tab", { name: "Study together" }).click();
  await page.getByRole("button", { name: "Create a room" }).click();
  await page.getByText("Invite code").waitFor();
  assert.match(await page.locator(".room-code strong").textContent(), /^[A-F0-9]{10}$/);

  await page.getByRole("tab", { name: "Distraction guard" }).click();
  await page.locator("#blockedDomains").fill("instagram.com\ntiktok.com");
  await page.getByRole("button", { name: "Save guard settings" }).click();
  await page.getByText("Settings saved.").waitFor();
  const extensionDownload = page.waitForEvent("download");
  await page.getByRole("link", { name: "Download browser extension" }).click();
  assert.equal((await extensionDownload).suggestedFilename(), "rebound-focus-guard.zip");

  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("tab", { name: "Weekly timetable" }).click();
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
  assert.deepEqual(errors, []);
  console.log("Focus browser checks passed.");
  await context.close();
} finally {
  await browser.close();
}
