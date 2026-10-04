// Rebound Landing & Download Portal Logic

document.addEventListener('DOMContentLoaded', () => {
  initOSDetection();
  initInteractiveDemo();
  initAccordions();
  initQRCodeModal();
  initSHACopy();
  initFloatingBar();
  initScrollAnimations();
});

// 1. OS Detection Logic
function initOSDetection() {
  const osPill = document.getElementById('detectedOsPill');
  const winCard = document.getElementById('card-windows');
  const androidCard = document.getElementById('card-android');

  const ua = navigator.userAgent || '';
  const platform = navigator.platform || '';

  let detectedOS = 'Windows';
  let isAndroid = /android/i.test(ua);
  let isWindows = /win/i.test(platform) || /windows/i.test(ua);
  let isMac = /mac/i.test(platform) || /macintosh/i.test(ua);

  if (isAndroid) {
    detectedOS = 'Android';
  } else if (isMac) {
    detectedOS = 'macOS';
  } else if (isWindows) {
    detectedOS = 'Windows 10/11';
  }

  if (osPill) {
    osPill.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
      Detected <strong>${detectedOS}</strong> — Recommended Download Highlighted Below
    `;
  }

  // Highlight primary platform card
  if (isAndroid && androidCard) {
    androidCard.classList.add('featured');
    if (winCard) winCard.classList.remove('featured');
  }
}

// 2. Live Interactive Schedule Demo
function initInteractiveDemo() {
  const slider = document.getElementById('demoBudgetSlider');
  const output = document.getElementById('demoBudgetValue');
  const barFills = document.querySelectorAll('.demo-body .bar-fill');
  const totalHours = document.getElementById('demoTotalHours');
  const statusBadge = document.getElementById('demoStatusBadge');

  if (!slider) return;

  const baseLoads = [45, 30, 60, 45, 25, 90, 15]; // default minutes per day

  function updateDemo() {
    const todayBudget = parseInt(slider.value, 10);
    if (output) output.textContent = `${todayBudget} min`;

    baseLoads[0] = todayBudget;

    let totalMins = 0;
    baseLoads.forEach((mins, idx) => {
      totalMins += mins;
      if (barFills[idx]) {
        // max bar height scale (180 mins = 100%)
        const pct = Math.min(100, Math.max(10, Math.round((mins / 180) * 100)));
        barFills[idx].style.height = `${pct}%`;
        
        // Color alert if day is overload (> 90 mins)
        if (mins > 90) {
          barFills[idx].style.background = 'linear-gradient(to top, #f59e0b, #ef4444)';
        } else {
          barFills[idx].style.background = 'linear-gradient(to top, #059669, #34d399)';
        }
      }
    });

    const hours = (totalMins / 60).toFixed(1);
    if (totalHours) totalHours.textContent = `${hours} hrs total study this week`;

    if (statusBadge) {
      if (todayBudget < 15) {
        statusBadge.textContent = 'Rest Mode';
        statusBadge.style.color = '#f59e0b';
      } else if (todayBudget > 120) {
        statusBadge.textContent = 'Heavy Study Day';
        statusBadge.style.color = '#38bdf8';
      } else {
        statusBadge.textContent = 'Optimal Balance';
        statusBadge.style.color = '#34d399';
      }
    }
  }

  slider.addEventListener('input', updateDemo);
  updateDemo();
}

// 3. Step-by-Step Accordions
function initAccordions() {
  const headers = document.querySelectorAll('.accordion-header');
  headers.forEach(header => {
    header.addEventListener('click', () => {
      const item = header.parentElement;
      const isActive = item.classList.contains('active');
      
      // Close all items
      document.querySelectorAll('.accordion-item').forEach(i => i.classList.remove('active'));

      if (!isActive) {
        item.classList.add('active');
      }
    });
  });
}

// 4. Mobile QR Code Modal
function initQRCodeModal() {
  const trigger = document.getElementById('showQrBtn');
  const modal = document.getElementById('qrModal');
  const closeBtn = document.getElementById('closeQrBtn');
  const container = document.getElementById('qrCodeContainer');

  if (!trigger || !modal) return;

  trigger.addEventListener('click', (e) => {
    e.preventDefault();
    modal.classList.add('active');
    renderQRCode();
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', () => modal.classList.remove('active'));
  }

  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('active');
  });

  function renderQRCode() {
    if (!container || container.children.length > 0) return;
    
    // Direct link to the APK endpoint on the current domain
    const apkUrl = window.location.origin + '/Rebound-v1.0.2-test.apk';
    
    // Simple canvas QR Code generator using standard QR matrix or quick SVG
    const img = document.createElement('img');
    // Use quick reliable public QR API or embedded SVG fallback
    img.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(apkUrl)}&color=091310&bgcolor=ffffff`;
    img.alt = 'Scan to download Rebound APK';
    img.width = 200;
    img.height = 200;
    
    container.appendChild(img);
  }
}

// 5. SHA-256 Copy Action
function initSHACopy() {
  const copyBtn = document.getElementById('copyHashBtn');
  if (!copyBtn) return;

  copyBtn.addEventListener('click', () => {
    const hash = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
    navigator.clipboard.writeText(hash).then(() => {
      const origText = copyBtn.innerHTML;
      copyBtn.innerHTML = `✓ Copied SHA-256`;
      copyBtn.style.color = '#34d399';
      setTimeout(() => {
        copyBtn.innerHTML = origText;
        copyBtn.style.color = '';
      }, 2500);
    });
  });
}

// 6. Floating Bar on Scroll
function initFloatingBar() {
  const floatingBar = document.getElementById('floatingBar');
  const heroGrid = document.querySelector('.download-grid');

  if (!floatingBar || !heroGrid) return;

  window.addEventListener('scroll', () => {
    const gridBottom = heroGrid.getBoundingClientRect().bottom;
    if (gridBottom < 0) {
      floatingBar.classList.add('visible');
    } else {
      floatingBar.classList.remove('visible');
    }
  });
}

// 7. Scroll Entrance Animations
function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, { threshold: 0.1 });

  const animatedEls = document.querySelectorAll('.feature-card, .accordion-item, .demo-window');
  animatedEls.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(24px)';
    el.style.transition = 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
    observer.observe(el);
  });
}
