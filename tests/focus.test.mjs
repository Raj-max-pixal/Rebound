import test from "node:test";
import assert from "node:assert/strict";
import {
  activeSchedule,
  dateKey,
  defaultSettings,
  elapsedMs,
  scheduleICS,
  streakDays,
  timerRemaining,
  validateSchedule,
  validateSettings,
} from "../dist/focus-core.mjs";

test("creates a Monday to Friday Physics and Chemistry timetable", () => {
  const first = validateSchedule({
    id: "physics",
    subject: "Physics",
    start: "18:00",
    end: "20:00",
    days: [1, 2, 3, 4, 5],
  });
  const second = validateSchedule({
    id: "chemistry",
    subject: "Chemistry",
    start: "20:00",
    end: "21:00",
    days: [1, 2, 3, 4, 5],
  }, [first]);
  assert.equal(first.subject, "Physics");
  assert.equal(second.start, "20:00");
});

test("rejects overlapping recurring timetable blocks", () => {
  const existing = [{ id: "physics", subject: "Physics", start: "18:00", end: "20:00", days: [1] }];
  assert.throws(() => validateSchedule({
    id: "math",
    subject: "Math",
    start: "19:30",
    end: "20:30",
    days: [1],
  }, existing), /overlaps/);
});

test("finds the active timetable block", () => {
  const settings = defaultSettings();
  settings.schedules = [{ id: "physics", subject: "Physics", start: "18:00", end: "20:00", days: [1] }];
  assert.equal(activeSchedule(settings.schedules, new Date("2026-10-05T18:30:00")).subject, "Physics");
  assert.equal(activeSchedule(settings.schedules, new Date("2026-10-05T20:00:00")), null);
});

test("timer elapsed time and remaining time are bounded", () => {
  const timer = { accumulated: 3000, anchor: 10000, running: true, duration: 20 };
  assert.equal(elapsedMs(timer, 12000), 5000);
  assert.equal(timerRemaining(timer, 12000), 15000);
  assert.equal(elapsedMs(timer, 9999999999), 12 * 60 * 60 * 1000);
});

test("streaks use completed focus time and local days", () => {
  const now = new Date("2026-10-05T19:00:00");
  const logs = [
    { status: "completed", ended: new Date("2026-10-05T12:00:00").getTime(), seconds: 3600 },
    { status: "completed", ended: new Date("2026-10-04T12:00:00").getTime(), seconds: 3600 },
    { status: "aborted", ended: new Date("2026-10-03T12:00:00").getTime(), seconds: 7200 },
  ];
  assert.equal(streakDays(logs, 60, now), 2);
});

test("settings reject unsafe domains and malformed YouTube entries", () => {
  const settings = defaultSettings();
  settings.domains = ["rebound-school-comeback.astrapro70.chatgpt.site"];
  assert.throws(() => validateSettings(settings), /Keep Rebound/);
  settings.domains = ["instagram.com"];
  settings.channels = ["not a channel"];
  assert.throws(() => validateSettings(settings), /YouTube/);
});

test("calendar export keeps the recurring weekday rule", () => {
  const calendar = scheduleICS([{ id: "physics", subject: "Physics", start: "18:00", end: "20:00", days: [1, 2, 3, 4, 5] }], new Date("2026-10-02T12:00:00"));
  assert.match(calendar, /RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR/);
  assert.match(calendar, /SUMMARY:Physics study/);
  assert.equal(dateKey(new Date("2026-10-02T12:00:00")), "2026-10-02");
});
