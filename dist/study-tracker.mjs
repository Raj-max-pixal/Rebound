import { icon } from "./icon-kit.mjs";

const tracker = document.createElement("section");
tracker.id = "studyTracker";
tracker.setAttribute("aria-label", "Study tracker");
(document.querySelector("#focusTown") || document.querySelector("#reboundWorld")).after(tracker);

const dateKey = (date) => new Date(date).toLocaleDateString("en-CA");
const week = () => Array.from({ length: 7 }, (_, index) => {
  const date = new Date();
  date.setDate(date.getDate() - 6 + index);
  return { key: dateKey(date), label: date.toLocaleDateString(undefined, { weekday: "narrow" }) };
});
const minutes = (logs) => Math.floor(logs.reduce((total, item) => total + Number(item.seconds || 0), 0) / 60);
const render = ({ logs = [], status = "" } = {}) => {
  const completed = logs.filter((item) => item.status === "completed");
  const days = week().map((day) => ({ ...day, minutes: minutes(completed.filter((item) => dateKey(item.ended || item.started) === day.key)) }));
  const weekly = minutes(completed);
  const today = days.at(-1).minutes;
  const max = Math.max(25, ...days.map((day) => day.minutes));
  const subjects = Object.entries(completed.reduce((totals, item) => ({ ...totals, [item.subject]: (totals[item.subject] || 0) + Number(item.seconds || 0) }), {}))
    .sort((a, b) => b[1] - a[1]).slice(0, 3);
  tracker.innerHTML = `
    <div class="tracker-heading"><div><p class="eyebrow">STUDY TRACKER</p><h2>See the work you made room for.</h2><p>Completed focus sessions only. This is not a screen-time score.</p></div><button class="quiet" id="trackerFocus">${icon("timer", "")} Start a focus session</button></div>
    <div class="tracker-grid"><article><span>${icon("timer", "", "tracker-icon")}</span><strong>${today} min</strong><small>today</small></article><article><span>${icon("chart", "", "tracker-icon")}</span><strong>${weekly} min</strong><small>last 7 days</small></article><article><span>${icon("shield", "", "tracker-icon")}</span><strong>${completed.length}</strong><small>completed sessions</small></article></div>
    <div class="tracker-detail"><div class="tracker-chart" aria-label="Last seven days of focus">${days.map((day) => `<div><i style="height:${Math.max(4, day.minutes / max * 100)}%"></i><strong>${day.minutes}</strong><span>${day.label}</span></div>`).join("")}</div><div class="tracker-subjects"><p class="eyebrow">TOP SUBJECTS</p>${subjects.length ? subjects.map(([subject, seconds]) => `<p><span>${subject.replace(/[<>&"]/g, "")}</span><strong>${Math.floor(seconds / 60)} min</strong></p>`).join("") : "<p class=\"muted\">Start one session and your subject progress will appear here.</p>"}</div></div>
    ${status ? `<p class="tracker-status">${status}</p>` : ""}`;
  document.querySelector("#trackerFocus").onclick = () => window.dispatchEvent(new CustomEvent("rebound:focus", { detail: { title: "Study tracker session", subject: "Study", minutes: 25 } }));
};

async function load() {
  const token = localStorage.getItem("rebound-focus-device");
  if (!/^[a-f0-9]{64}$/.test(token || "")) return render({ status: "Create your first focus session to start tracking." });
  try {
    const response = await fetch("/api/state", { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) throw new Error();
    render(await response.json());
  } catch { render({ status: "Study history is temporarily unavailable. Your local plan is still private in this browser." }); }
}

window.addEventListener("rebound:focus-finished", load);
load();
