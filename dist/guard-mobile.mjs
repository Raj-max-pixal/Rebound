const packages = [
  ['instagram', 'Instagram'], ['tiktok', 'TikTok'], ['youtube', 'YouTube'],
  ['snapchat', 'Snapchat'], ['reddit', 'Reddit'],
];

function load() {
  try { return JSON.parse(localStorage.getItem('rebound-mobile-guard') || '{}'); }
  catch { return {}; }
}

function save(value) { localStorage.setItem('rebound-mobile-guard', JSON.stringify(value)); }

function mountMobileGuard() {
  const host = document.getElementById('ft-wellbeing');
  if (!host || document.getElementById('mobileGuard')) return;
  let state = { enabled: false, apps: packages.map(([id]) => id), ...load() };
  const card = document.createElement('section');
  card.id = 'mobileGuard';
  card.className = 'mobile-guard-card';
  card.innerHTML = `
    <div class="guard-mobile-head">
      <div><p class="eyebrow">ANDROID FOCUS GUARD</p><h2>Scroll less. Get your time back.</h2></div>
      <button class="guard-power" id="guardPower" aria-pressed="false">Guard off</button>
    </div>
    <p class="guard-mobile-copy">Choose distracting apps for a focus session. Rebound will ask for Android’s Accessibility permission before it can interrupt another app.</p>
    <div class="guard-usage" aria-label="Today’s distraction tracking">
      <div><span>Reels & Shorts</span><strong id="reelsUsage">Permission needed</strong></div>
      <div><span>Focus protected</span><strong id="guardMinutes">0 min</strong></div>
    </div>
    <p class="guard-label">Block during focus</p>
    <div class="guard-apps" id="guardApps">${packages.map(([id, label]) => `<button type="button" data-app="${id}" aria-pressed="false">${label}</button>`).join('')}</div>
    <div class="guard-intervention">
      <span class="guard-stop">🛑</span><div><strong>“Bro, 20 minutes gone. Still wanna scroll?”</strong><small>Preview of the interruption shown when a selected app is opened during a guard session.</small></div>
    </div>
    <div class="guard-actions"><button class="primary" id="startMobileGuard">Start 25-min guard</button><button class="quiet" id="guardPermissions">Set up Android permissions</button></div>
    <p class="guard-note" id="guardNote">In this browser preview, app blocking and screen-time data are unavailable. The Android build needs your explicit permission.</p>`;
  host.prepend(card);

  const render = () => {
    card.querySelector('#guardPower').textContent = state.enabled ? 'Guard on' : 'Guard off';
    card.querySelector('#guardPower').setAttribute('aria-pressed', String(state.enabled));
    card.querySelector('#guardMinutes').textContent = state.enabled ? '25 min ready' : '0 min';
    card.querySelectorAll('[data-app]').forEach(button => button.setAttribute('aria-pressed', String(state.apps.includes(button.dataset.app))));
  };
  card.querySelector('#guardPower').onclick = () => { state.enabled = !state.enabled; save(state); render(); };
  card.querySelector('#guardApps').onclick = event => {
    const button = event.target.closest('[data-app]'); if (!button) return;
    const id = button.dataset.app;
    state.apps = state.apps.includes(id) ? state.apps.filter(x => x !== id) : [...state.apps, id];
    save(state); render();
  };
  card.querySelector('#startMobileGuard').onclick = () => {
    state.enabled = true; save(state); render();
    card.querySelector('#guardNote').textContent = 'Preview enabled. In the APK, this starts a 25-minute Android guard after Accessibility permission is enabled.';
  };
  card.querySelector('#guardPermissions').onclick = () => {
    card.querySelector('#guardNote').textContent = 'Android setup opens system Accessibility and Usage Access settings. You choose whether to grant either permission.';
  };
  render();
}

window.addEventListener('rebound:focus-ready', mountMobileGuard);
if (document.getElementById('ft-wellbeing')) mountMobileGuard();
else {
  const observer = new MutationObserver(() => {
    if (document.getElementById('ft-wellbeing')) { mountMobileGuard(); observer.disconnect(); }
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
}
