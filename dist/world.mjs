const key = "rebound-world-v1";
const stylesheet = document.createElement("link");
stylesheet.rel = "stylesheet";
stylesheet.href = "world.css";
document.head.append(stylesheet);
const companions = [
  ["Bear", "🐻"],
  ["Bunny", "🐰"],
  ["Fox", "🦊"],
  ["Cat", "🐱"],
  ["Panda", "🐼"],
];
const $ = (id) => document.getElementById(id);

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(key) || "{}");
    return {
      xp: Number.isInteger(saved.xp) ? Math.max(0, saved.xp) : 0,
      coins: Number.isInteger(saved.coins) ? Math.max(0, saved.coins) : 0,
      buddy: companions.some(([name]) => name === saved.buddy) ? saved.buddy : "Bear",
      comebacks: Number.isInteger(saved.comebacks) ? Math.max(0, saved.comebacks) : 0,
      focusCredited: Number.isInteger(saved.focusCredited) ? Math.max(0, saved.focusCredited) : 0,
      lowEnergyDay: typeof saved.lowEnergyDay === "string" ? saved.lowEnergyDay : "",
      lastProgressDay: typeof saved.lastProgressDay === "string" ? saved.lastProgressDay : "",
      awards: Array.isArray(saved.awards) ? saved.awards : [],
    };
  } catch {
    return { xp: 0, coins: 0, buddy: "Bear", comebacks: 0, focusCredited: 0, lowEnergyDay: "", lastProgressDay: "", awards: [] };
  }
}

let state = load();
const today = () => new Date().toISOString().slice(0, 10);
const level = () => Math.floor(state.xp / 100) + 1;
const nextLevel = () => level() * 100;
const icon = () => companions.find(([name]) => name === state.buddy)?.[1] || "🐻";
const world = () => {
  const minutes = Math.floor(state.xp / 2);
  if (minutes >= 200) return "🏡🌲🌳🌲";
  if (minutes >= 100) return "🌲🌳🌿";
  if (minutes >= 50) return "🌿🌱🌿";
  if (minutes >= 25) return "🌱🌿";
  return "🌱";
};

const panel = document.createElement("section");
panel.id = "reboundWorld";
panel.setAttribute("aria-label", "Rebound World progress");
document.querySelector("header").after(panel);

function message() {
  if (state.lowEnergyDay === today()) return "Low-energy mode is on. Ten focused minutes is enough for today.";
  if (state.lastProgressDay !== today()) return "Missed a day? It’s okay. We can start again today.";
  if (state.xp === 0) return "Ready to rebound? One small session grows your world.";
  return `You showed up. Your world grew with ${Math.floor(state.xp / 2)} focused minutes.`;
}

function save() {
  localStorage.setItem(key, JSON.stringify(state));
}

function render() {
  const progress = Math.min(100, ((state.xp % 100) / 100) * 100);
  panel.innerHTML = `
    <div class="world-copy">
      <p class="eyebrow">YOUR REBOUND WORLD</p>
      <h2>One next step. <span>Then another.</span></h2>
      <p>${message()}</p>
      <div class="world-actions">
        <button class="primary" id="rescueButton">5-minute rescue</button>
        <button class="quiet" id="badDayButton">Today is not my day</button>
      </div>
    </div>
    <div class="world-scene" aria-label="${state.buddy}'s study world">
      <span class="world-land">${world()}</span>
      <span class="world-buddy" aria-hidden="true">${icon()}</span>
      <span class="world-stars" aria-hidden="true">✦ ✧</span>
    </div>
    <div class="world-stats">
      <div><strong>Level ${level()}</strong><span>${state.xp} XP · ${state.coins} sparks</span><progress value="${progress}" max="100"></progress><small>${nextLevel() - state.xp} XP to the next level</small></div>
      <div><strong>${state.comebacks}</strong><span>comebacks</span><small>Returning after a hard day counts too.</small></div>
      <label>Buddy<select id="buddyPicker">${companions.map(([name, emoji]) => `<option value="${name}" ${name === state.buddy ? "selected" : ""}>${emoji} ${name}</option>`).join("")}</select></label>
    </div>`;
  $("buddyPicker").onchange = (event) => {
    state.buddy = event.target.value;
    save();
    render();
  };
  $("rescueButton").onclick = () => window.dispatchEvent(new CustomEvent("rebound:rescue"));
  $("badDayButton").onclick = () => window.dispatchEvent(new CustomEvent("rebound:bad-day"));
}

function earn(amount, kind) {
  const previousLevel = level();
  state.xp += amount;
  state.coins += Math.max(1, Math.floor(amount / 10));
  state.lastProgressDay = today();
  if (kind === "comeback") state.comebacks += 1;
  if (level() > previousLevel) state.awards = [...new Set([...state.awards, `level-${level()}`])];
  save();
  render();
  if (level() > previousLevel) document.dispatchEvent(new CustomEvent("rebound:celebrate", { detail: { title: `Level ${level()} unlocked!`, body: `${icon()} Your buddy is celebrating your progress.` } }));
}

window.addEventListener("rebound:focus-finished", (event) => {
  if (event.detail?.status === "completed") earn(Math.max(10, Math.floor(event.detail.seconds / 60)), "focus");
});
window.addEventListener("rebound:assignment-completed", () => earn(20, "assignment"));
window.addEventListener("rebound:bad-day-complete", () => earn(15, "comeback"));

window.addEventListener("rebound:rescue", () => {
  window.location.hash = "#focus";
  window.dispatchEvent(new CustomEvent("rebound:focus", { detail: { title: "5-minute rescue", subject: "Quick review", minutes: 5 } }));
});
window.addEventListener("rebound:bad-day", () => {
  try {
    const plan = JSON.parse(localStorage.getItem("rebound-plan-v1") || "{}");
    if (plan && plan.version === 1) {
      plan.todayBudget = Math.min(Number(plan.todayBudget) || 10, 10);
      plan.budgetDate = today();
      localStorage.setItem("rebound-plan-v1", JSON.stringify(plan));
    }
  } catch {}
  state.lowEnergyDay = today();
  state.comebacks += 1;
  save();
  window.location.hash = "#catchup";
  window.location.reload();
});

async function syncFocusProgress() {
  try {
    const token = localStorage.getItem("rebound-focus-device");
    if (!/^[a-f0-9]{64}$/.test(token || "")) return;
    const response = await fetch("/api/state", { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) return;
    const data = await response.json();
    const completedMinutes = Math.floor((data.logs || [])
      .filter((entry) => entry.status === "completed")
      .reduce((total, entry) => total + Number(entry.seconds || 0), 0) / 60);
    if (completedMinutes > state.focusCredited) {
      earn(completedMinutes - state.focusCredited, "focus");
      state.focusCredited = completedMinutes;
      save();
    }
  } catch {}
}

syncFocusProgress();
setInterval(syncFocusProgress, 30000);

render();
