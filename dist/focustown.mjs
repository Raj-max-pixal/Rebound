import { icon } from "./icon-kit.mjs";

// FocusTown is an original Rebound activity space; its visuals and copy are not
// derived from any third-party focus product.
const key = "rebound-focustown-v1";
const scenes = [
  ["Sky Garden", "cloud", "Quiet clouds, tiny goals, and a clear desk."],
  ["Moon Library", "moon", "A gentle place for reading and writing."],
  ["Pixel Park", "park", "A bright place for problem solving and practice."],
];
const $ = (selector) => document.querySelector(selector);
const stored = (() => {
  try { return JSON.parse(localStorage.getItem(key) || "{}"); } catch { return {}; }
})();
let state = {
  scene: scenes.some(([name]) => name === stored.scene) ? stored.scene : "Sky Garden",
  sparks: Number.isInteger(stored.sparks) ? Math.max(0, stored.sparks) : 0,
  gameHighScore: Number.isInteger(stored.gameHighScore) ? Math.max(0, stored.gameHighScore) : 0,
};
const save = () => localStorage.setItem(key, JSON.stringify(state));

const css = document.createElement("link");
css.rel = "stylesheet";
css.href = "focustown.css";
document.head.append(css);

const section = document.createElement("section");
section.id = "focusTown";
section.setAttribute("aria-label", "FocusTown activity space");
(document.querySelector("#reboundWorld") || document.querySelector("header")).after(section);

function sceneData() { return scenes.find(([name]) => name === state.scene) || scenes[0]; }
function render() {
  const [name, iconName, description] = sceneData();
  section.innerHTML = `
    <div class="town-heading">
      <p class="eyebrow">FOCUSTOWN · A REBOUND PLACE</p>
      <h2>Play the first minute. <span>Focus for the next.</span></h2>
      <p>Choose a scene, start a tiny mission, or earn a few sparks in a short game. Your study plan stays in charge.</p>
    </div>
    <div class="town-scene" data-scene="${name}">
      <div class="town-sky" aria-hidden="true">${icon("spark", "", "town-spark")} ${icon("spark", "", "town-spark")} ${icon("spark", "", "town-spark")}</div>
      <span class="scene-icon">${icon(iconName, name, "scene-mark")}</span>
      <div><p class="eyebrow">CURRENT SCENE</p><h3>${name}</h3><p>${description}</p></div>
      <button class="primary" id="townMission">Start a 10-minute mission</button>
    </div>
    <div class="town-grid">
      <article class="town-card"><p class="eyebrow">CHOOSE YOUR PLACE</p>
        <div class="scene-choices">${scenes.map(([scene, iconName]) => `<button class="scene-choice ${scene === name ? "selected" : ""}" data-scene="${scene}" aria-pressed="${scene === name}">${icon(iconName, "")}<span>${scene}</span></button>`).join("")}</div>
      </article>
      <article class="town-card audio-card"><p class="eyebrow">SOUND CORNER</p><h3>Soft study sounds</h3><p>Start or stop a browser-made calm tone. It never auto-plays.</p><button class="quiet" id="townSound">Play soft sound</button></article>
      <article class="town-card game-card"><p class="eyebrow">SPARK DASH</p><h3>Catch the sparks</h3><p id="gameMessage">A 20-second finger warm-up. Best: ${state.gameHighScore} sparks.</p><button class="quiet" id="sparkGame">Play Spark Dash</button></article>
    </div>
    <p class="town-note">FocusTown uses original artwork made from text and CSS. It is designed for ages 13–18; no chat, public profiles, or personal details are needed here.</p>`;
  section.querySelectorAll("[data-scene]").forEach((button) => button.onclick = () => {
    state.scene = button.dataset.scene;
    save(); render();
  });
  $("#townMission").onclick = () => window.dispatchEvent(new CustomEvent("rebound:focus", { detail: { title: `${name} mission`, subject: name, minutes: 10 } }));
  $("#townSound").onclick = toggleSound;
  $("#sparkGame").onclick = startGame;
}

let audio;
function toggleSound(event) {
  if (audio) { audio.close(); audio = null; event.currentTarget.textContent = "Play soft sound"; return; }
  audio = new AudioContext();
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  oscillator.type = "sine"; oscillator.frequency.value = 174;
  gain.gain.value = 0.025;
  oscillator.connect(gain).connect(audio.destination); oscillator.start();
  event.currentTarget.textContent = "Stop soft sound";
}

function startGame() {
  const button = $("#sparkGame");
  const message = $("#gameMessage");
  let score = 0;
  let active = true;
  button.textContent = "Catch!";
  button.classList.add("spark-running");
  const hit = () => { if (active) { score += 1; message.textContent = `${score} sparks caught — keep going!`; } };
  button.onclick = hit;
  window.setTimeout(() => {
    active = false;
    state.sparks += score;
    state.gameHighScore = Math.max(state.gameHighScore, score);
    save();
    button.classList.remove("spark-running");
    button.textContent = "Play Spark Dash";
    button.onclick = startGame;
    message.textContent = `You caught ${score} sparks. Best: ${state.gameHighScore} sparks.`;
    if (score) window.dispatchEvent(new CustomEvent("rebound:town-sparks", { detail: { sparks: score } }));
  }, 20000);
}

render();
