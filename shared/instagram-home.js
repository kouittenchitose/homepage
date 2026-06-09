(function initInstagramHome(global) {
  function parseInstagramUrl(raw) {
    if (!raw || typeof raw !== 'string') return null;
    try {
      const u = new URL(raw.trim());
      const host = u.hostname.replace(/^www\./, '').replace(/^m\./, '');
      if (host !== 'instagram.com') return null;

      const parts = u.pathname.replace(/\/+$/, '').split('/').filter(Boolean);
      if (!parts.length) return null;

      const head = parts[0].toLowerCase();
      if (head === 'p' || head === 'reel' || head === 'reels' || head === 'tv') {
        const id = parts[1];
        if (!id) return null;
        const path = `/${head}/${id}/`;
        return {
          kind: 'post',
          permalink: `https://www.instagram.com${path}`,
        };
      }

      if (parts.length === 1 && !['explore', 'accounts', 'stories', 'direct'].includes(head)) {
        const username = parts[0];
        return {
          kind: 'profile',
          username,
          permalink: `https://www.instagram.com/${username}/`,
          embedSrc: `https://www.instagram.com/${encodeURIComponent(username)}/embed`,
        };
      }

      return null;
    } catch {
      return null;
    }
  }

  function loadEmbedScript(onReady, onError) {
    if (global.instgrm && global.instgrm.Embeds) {
      onReady();
      return;
    }

    const existing = document.querySelector('script[data-kouitten-instagram-embed]');
    if (existing) {
      existing.addEventListener('load', () => onReady(), { once: true });
      existing.addEventListener('error', () => onError && onError(), { once: true });
      return;
    }

    const sc = document.createElement('script');
    sc.async = true;
    sc.src = 'https://www.instagram.com/embed.js';
    sc.dataset.kouittenInstagramEmbed = '1';
    sc.onload = () => onReady();
    sc.onerror = () => onError && onError();
    document.body.appendChild(sc);
  }

  function renderPostEmbed(container, permalink) {
    container.innerHTML =
      `<blockquote class="instagram-media" data-instgrm-permalink="${permalink.replace(/"/g, '&quot;')}" data-instgrm-version="14" style="background:#FFF;border:0;border-radius:14px;margin:0 auto;max-width:540px;min-width:220px;width:100%;padding:0;"></blockquote>`;

    loadEmbedScript(
      () => {
        try {
          if (global.instgrm && global.instgrm.Embeds) global.instgrm.Embeds.process();
        } catch (_) {}
        setTimeout(() => {
          try {
            if (global.instgrm && global.instgrm.Embeds) global.instgrm.Embeds.process();
          } catch (_) {}
        }, 800);
      },
      () => renderFallback(container, permalink)
    );
  }

  function renderProfileEmbed(container, parsed) {
    container.innerHTML = `
      <iframe
        class="instagram-profile-embed"
        src="${parsed.embedSrc}"
        title="Instagram @${parsed.username.replace(/"/g, '')}"
        loading="lazy"
        allowtransparency="true"
        allow="encrypted-media"
        referrerpolicy="strict-origin-when-cross-origin"
      ></iframe>
      <p class="instagram-embed-fallback">
        <a href="${parsed.permalink.replace(/"/g, '&quot;')}" target="_blank" rel="noopener noreferrer">@${parsed.username} をInstagramで見る</a>
      </p>`;
  }

  function renderFallback(container, url) {
    const safe = String(url || '').replace(/"/g, '&quot;');
    container.innerHTML = `
      <p class="instagram-embed-fallback">
        埋め込みを読み込めませんでした。
        <a href="${safe}" target="_blank" rel="noopener noreferrer">Instagramで見る</a>
      </p>`;
  }

  function mountInstagramHome(container, rawUrl) {
    if (!container) return;
    const parsed = parseInstagramUrl(rawUrl);
    if (!parsed) {
      container.innerHTML = '';
      return;
    }
    if (parsed.kind === 'post') {
      renderPostEmbed(container, parsed.permalink);
      return;
    }
    renderProfileEmbed(container, parsed);
  }

  global.InstagramHome = {
    parseInstagramUrl,
    mountInstagramHome,
  };
})(typeof window !== 'undefined' ? window : globalThis);
