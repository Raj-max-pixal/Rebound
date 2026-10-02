import { icon } from "./icon-kit.mjs";

const $ = (id) => document.getElementById(id);
const deviceKey = "rebound-focus-device";
const reasonKey = "rebound-focus-reason";
const roomKey = "rebound-room";
const scenes = [
  ["Window Desk", "cloud", "A bright space for a five-minute restart."],
  ["Night Library", "moon", "A quiet space for reading and revision."],
  ["Practice Grove", "park", "A steady space for problem sets and drills."],
];
let selectedMinutes = 25;
let active = null;
let room = localStorage.getItem(roomKey) || "";
let soundContext;
let soundSource;

function token() {
  let value = localStorage.getItem(deviceKey);
  if (!/^[a-f0-9]{64}$/.test(value || "")) {
    value = [...crypto.getRandomValues(new Uint8Array(32))].map((number) => number.toString(16).padStart(2, "0")).join("");
    localStorage.setItem(deviceKey, value);
  }
  return value;
}
async function call(path, method = "GET", body) {
  const response = await fetch(`/api/${path}`, { method, headers: { Authorization: `Bearer ${token()}`, ...(body ? { "Content-Type": "application/json" } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Request failed");
  return data;
}
const clock = (seconds) => `${String(Math.max(0, Math.floor(seconds)) / 60 | 0).padStart(2, "0")}:${String(Math.max(0, Math.floor(seconds)) % 60).padStart(2, "0")}`;
const setStatus = (message) => { $("focusStatus").textContent = message; };
function renderClock() {
  const seconds = active ? Math.max(0, active.planned - Math.floor((Date.now() - active.started) / 1000)) : selectedMinutes * 60;
  $("areaClock").textContent = clock(seconds);
  $("timerCaption").textContent = active ? "focusing" : "ready";
  $("startFocus").hidden = !!active;
  $("endFocus").hidden = !active;
  if (active && seconds <= 0) finish(false);
}
function renderScenes() {
  $("spaceGrid").innerHTML = scenes.map(([name, iconName, detail], index) => `<button class="space-card ${index === 0 ? "selected" : ""}" data-scene="${name}">${icon(iconName, "")}<strong>${name}</strong><small>${detail}</small></button>`).join("");
  $("spaceGrid").onclick = (event) => {
    const card = event.target.closest("[data-scene]"); if (!card) return;
    $("spaceGrid").querySelectorAll(".space-card").forEach((item) => item.classList.toggle("selected", item === card));
    $("companionMessage").textContent = `${card.dataset.scene} is ready for your next step.`;
  };
}
async function start() {
  if (active) return;
  const subject = $("subjectInput").value.trim();
  if (!subject) return setStatus("Name one subject or task first.");
  try {
    const id = crypto.randomUUID();
    const data = await call("sessions/start", "POST", { id, subject, mode: "countdown", planned: selectedMinutes * 60, room: room || null });
    active = { id, subject, planned: selectedMinutes * 60, started: data.started };
    setStatus("Focus started. Keep this page open and take the next small step.");
    renderClock();
  } catch (error) { setStatus(error.message); }
}
async function finish(aborted) {
  if (!active) return;
  const current = active;
  active = null;
  try {
    const seconds = Math.min(current.planned, Math.max(0, Math.floor((Date.now() - current.started) / 1000)));
    const result = await call("sessions/finish", "POST", { id: current.id, seconds, status: aborted ? "aborted" : "completed", interruptions: 0 });
    setStatus(result.session.status === "completed" ? "Session saved. You made room for what matters." : "Session ended. A fresh start is always available.");
    await loadMomentum();
  } catch (error) { setStatus(error.message); }
  renderClock();
}
async function refreshRoom() {
  if (!room) { $("roomMembers").innerHTML = '<p class="muted">Create or join a room to see its activity.</p>'; return; }
  try {
    const data = await call(`rooms/${room}`);
    $("roomStatus").textContent = `Room ${room}. Share this code only with people you want to invite.`;
    $("roomMembers").innerHTML = data.members.map((member) => `<div class="member"><i class="${member.online ? "online" : ""}"></i><strong>${member.alias.replace(/[<>&"]/g, "")}</strong><span>${Math.floor(member.seconds / 60)} min</span></div>`).join("");
  } catch (error) { $("roomStatus").textContent = error.message; }
}
async function createRoom() { try { room = (await call("rooms", "POST")).code; localStorage.setItem(roomKey, room); $("roomCode").value = room; await refreshRoom(); } catch (error) { $("roomStatus").textContent = error.message; } }
async function joinRoom() { try { room = (await call("rooms/join", "POST", { code: $("roomCode").value })).code; localStorage.setItem(roomKey, room); await refreshRoom(); } catch (error) { $("roomStatus").textContent = error.message; } }
async function loadMomentum() {
  try {
    const { logs } = await call("state");
    const complete = logs.filter((item) => item.status === "completed");
    const days = Array.from({ length: 7 }, (_, index) => { const day = new Date(); day.setDate(day.getDate() - 6 + index); return day; });
    const key = (day) => day.toLocaleDateString("en-CA");
    const values = days.map((day) => Math.floor(complete.filter((item) => key(new Date(item.ended)) === key(day)).reduce((total, item) => total + item.seconds, 0) / 60));
    const total = values.reduce((sum, value) => sum + value, 0);
    $("weeklyMinutes").textContent = `${total} minutes this week`;
    $("momentumDetail").textContent = complete.length ? `${complete.length} completed sessions saved under this browser’s private device key.` : "Your completed focus sessions will show here.";
    const max = Math.max(25, ...values);
    $("weekBars").innerHTML = values.map((value, index) => `<div><i style="height:${Math.max(4, value / max * 100)}%"></i><span>${days[index].toLocaleDateString(undefined, { weekday: "narrow" })}</span></div>`).join("");
  } catch { $("momentumDetail").textContent = "Study history will appear after your first saved session."; }
}
async function toggleSound() {
  if (soundContext) { await soundContext.close(); soundContext = null; soundSource = null; $("soundButton").textContent = "Play sound"; return; }
  const choice = $("soundSelect").value;
  if (choice === "none") return setStatus("Choose a soundscape first.");
  soundContext = new (window.AudioContext || window.webkitAudioContext)();
  const buffer = soundContext.createBuffer(1, soundContext.sampleRate * 3, soundContext.sampleRate);
  const values = buffer.getChannelData(0); let last = 0;
  values.forEach((_, index) => { const noise = Math.random() * 2 - 1; last = choice === "brown" ? (last + 0.02 * noise) / 1.02 : noise; values[index] = choice === "brown" ? last * 3.3 : noise * .35; });
  soundSource = soundContext.createBufferSource(); soundSource.buffer = buffer; soundSource.loop = true;
  const gain = soundContext.createGain(); gain.gain.value = .05; soundSource.connect(gain).connect(soundContext.destination); soundSource.start(); $("soundButton").textContent = "Stop sound";
}
function bind() {
  $("companionMark").innerHTML = icon("bear", "Focus Area companion");
  $("soundIcon").innerHTML = icon("sound", ""); $("usersIcon").innerHTML = icon("users", ""); $("chartIcon").innerHTML = icon("chart", "");
  renderScenes();
  $("reasonInput").value = localStorage.getItem(reasonKey) || "";
  $("saveReason").onclick = () => { localStorage.setItem(reasonKey, $("reasonInput").value.trim()); $("reasonStatus").textContent = "Saved privately in this browser."; };
  document.querySelectorAll("[data-minutes]").forEach((button) => button.onclick = () => { if (active) return; selectedMinutes = Number(button.dataset.minutes); document.querySelectorAll("[data-minutes]").forEach((item) => item.classList.toggle("selected", item === button)); renderClock(); });
  $("startFocus").onclick = start; $("endFocus").onclick = () => finish(true); $("soundButton").onclick = toggleSound; $("createRoom").onclick = createRoom; $("joinRoom").onclick = joinRoom; $("refreshRoom").onclick = refreshRoom;
  $("breathButton").onclick = () => { const ring = $("breathRing"); ring.classList.toggle("active"); $("breathText").textContent = ring.classList.contains("active") ? "Breathe in · breathe out" : "Ready"; $("breathButton").textContent = ring.classList.contains("active") ? "Stop reset" : "Start reset"; };
  renderClock(); setInterval(renderClock, 1000); refreshRoom(); loadMomentum();
}
bind();
