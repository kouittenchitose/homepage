async function fetchAnnivConfig() {
  try {
    const res = await fetch('/api/content?type=anniv-config', { cache: 'no-cache' });
    if (!res.ok) return { published: false };
    const data = await res.json();
    if (Array.isArray(data)) return { published: false };
    return { published: !!data.published };
  } catch (e) {
    return { published: false };
  }
}

async function fetchAnnivContent() {
  try {
    const res = await fetch('/api/content?type=anniv', { cache: 'no-cache' });
    if (!res.ok) return '';
    const data = await res.json();
    if (!data || typeof data !== 'object') return '';
    return String(data.content || '');
  } catch (e) {
    return '';
  }
}

async function fetchSponsorsPayload() {
  try {
    const res = await fetch('/api/content?type=sponsors', { cache: 'no-cache' });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
    return data;
  } catch (e) {
    return null;
  }
}

function setAnnivButtonVisibility(published) {
  document.querySelectorAll('.nav-anniv-btn').forEach((btn) => {
    btn.style.display = published ? 'inline-block' : 'none';
  });
}

function setSponsorsNavVisibility(published) {
  document.querySelectorAll('.nav-sponsors-btn').forEach((btn) => {
    btn.style.display = published ? 'inline-flex' : 'none';
  });
}

function renderSponsorsPageFromData(data) {
  const introEl = document.getElementById('sponsors-intro');
  const listEl = document.getElementById('sponsors-list');
  if (!listEl) return;

  if (introEl) {
    const intro = String(data.intro || '').trim();
    if (intro) {
      introEl.hidden = false;
      introEl.textContent = intro;
      introEl.style.whiteSpace = 'pre-line';
    } else {
      introEl.hidden = true;
      introEl.textContent = '';
    }
  }

  listEl.innerHTML = '';
  const items = Array.isArray(data.items) ? data.items : [];
  if (!items.length) {
    const p = document.createElement('p');
    p.className = 'sponsors-empty';
    p.style.cssText = 'text-align:center;color:var(--text-sub);padding:2rem 1rem;';
    p.textContent = '協賛企業・団体の情報は準備中です。';
    listEl.appendChild(p);
    return;
  }

  items.forEach((it) => {
    const card = document.createElement('article');
    card.className = 'sponsor-card fade-up visible';
    const name = String(it.name || '').trim();
    const url = String(it.url || '').trim();
    const logoUrl = String(it.logoUrl || '').trim();

    const inner = document.createElement('div');
    inner.className = 'sponsor-card-inner';

    if (logoUrl) {
      const img = document.createElement('img');
      img.className = 'sponsor-logo';
      img.src = logoUrl;
      img.alt = name || '';
      img.loading = 'lazy';
      inner.appendChild(img);
    }

    const body = document.createElement('div');
    body.className = 'sponsor-body';

    if (url) {
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.className = 'sponsor-name-link';
      a.textContent = name;
      body.appendChild(a);
    } else {
      const span = document.createElement('div');
      span.className = 'sponsor-name';
      span.textContent = name;
      body.appendChild(span);
    }

    inner.appendChild(body);
    card.appendChild(inner);
    listEl.appendChild(card);
  });
}

async function initAnnivVisibility() {
  const [config, sponsorsData] = await Promise.all([fetchAnnivConfig(), fetchSponsorsPayload()]);

  const isPublished = !!config.published;
  setAnnivButtonVisibility(isPublished);

  const spPublished = !!(sponsorsData && sponsorsData.published);
  setSponsorsNavVisibility(spPublished);

  const isAnnivPage = document.body.dataset.annivPage === 'true';
  if (isAnnivPage && !isPublished) {
    window.location.href = 'index.html';
    return;
  }

  const isSponsorsPage = document.body.dataset.sponsorsPage === 'true';
  if (isSponsorsPage && !spPublished) {
    window.location.href = 'index.html';
    return;
  }

  if (isAnnivPage) {
    const contentEl = document.getElementById('anniv-dynamic-content');
    if (contentEl) {
      const content = await fetchAnnivContent();
      if (content.trim()) {
        contentEl.textContent = content;
        contentEl.style.whiteSpace = 'pre-line';
      }
    }
  }

  if (isSponsorsPage && sponsorsData) {
    renderSponsorsPageFromData(sponsorsData);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAnnivVisibility);
} else {
  initAnnivVisibility();
}
