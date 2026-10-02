import { createRequire } from "node:module";
import assert from "node:assert/strict";

const require = createRequire(import.meta.url);
const { chromium } = require("C:/Users/SARANYA/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const browser = await chromium.launch({ headless: true, executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" });
try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 1000 } });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${process.env.REBOUND_URL || "http://127.0.0.1:4173"}/focus-area.html`);
  await page.getByRole("heading", { name: "Find a place. Make a little progress." }).waitFor();
  await page.getByRole("button", { name: "Night Library" }).click();
  await page.getByText("Night Library is ready for your next step.").waitFor();
  await page.getByRole("button", { name: "5 minute rescue" }).click();
  assert.equal(await page.locator("#areaClock").textContent(), "05:00");
  await page.getByRole("button", { name: "Start focus" }).click();
  await page.getByRole("button", { name: "End session" }).waitFor();
  await page.getByRole("button", { name: "End session" }).click();
  await page.getByText("Session ended. A fresh start is always available.").waitFor();
  await page.getByRole("button", { name: "Create a room" }).click();
  await page.getByText(/Room [A-F0-9]{10}/).waitFor();
  assert.deepEqual(errors, []);
  await context.close();
  console.log("Focus Area browser checks passed.");
} finally { await browser.close(); }
