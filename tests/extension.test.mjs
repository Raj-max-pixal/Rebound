import test from "node:test";
import assert from "node:assert/strict";
import { makeRules } from "../extension/rules.mjs";
import { defaultSettings } from "../extension/focus-core.mjs";

test("creates granular browser rules only while focus blocking is active", () => {
  const settings = defaultSettings();
  settings.domains = ["reddit.com"];
  settings.shorts = true;
  settings.reels = true;
  const inactive = makeRules(settings, false);
  assert.equal(inactive.length, 0);
  const rules = makeRules(settings, true);
  assert.equal(rules.length, 3);
  assert.match(rules[0].condition.urlFilter, /reddit/);
  assert.match(rules[1].condition.regexFilter, /youtube/);
  assert.match(rules[2].condition.regexFilter, /instagram/);
});

test("uses daily allowance rules even when a focus session is not active", () => {
  const settings = defaultSettings();
  settings.limits = [{ domain: "instagram.com", minutes: 20 }];
  const rules = makeRules(settings, false, { "instagram.com": 1200 });
  assert.equal(rules.length, 1);
  assert.match(rules[0].condition.urlFilter, /instagram/);
});
