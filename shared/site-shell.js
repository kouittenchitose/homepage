function toggleMenu() {
  const menu = document.getElementById('nav-menu');
  const hamburger = document.getElementById('hamburger');
  if (!menu || !hamburger) return;
  menu.classList.toggle('active');
  hamburger.classList.toggle('active');
}

function closeMenu() {
  const menu = document.getElementById('nav-menu');
  const hamburger = document.getElementById('hamburger');
  if (!menu || !hamburger) return;
  menu.classList.remove('active');
  hamburger.classList.remove('active');
}

function initNavMenuCloseOnNavigate() {
  document.querySelectorAll('#nav-menu a, .nav-logo-container').forEach((link) => {
    link.addEventListener('click', closeMenu);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initNavMenuCloseOnNavigate);
} else {
  initNavMenuCloseOnNavigate();
}

async function loadSharedLogo() {
  try {
    const res = await fetch('/api/admin-core', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-cache',
      body: JSON.stringify({ action: 'get-assets-map' })
    });
    if (!res.ok) return {};
    const assets = await res.json();
    if (assets.logo) {
      document.querySelectorAll('#logo-area').forEach((el) => {
        el.innerHTML = `<img src="${assets.logo}" alt="光一天" class="nav-logo-img">`;
      });
    }
    return assets || {};
  } catch (e) {
    return {};
  }
}
