/**
 * YouTube URL → 動画ID・埋め込みHTML（作品詳細など共通）
 */
(function initYoutubeEmbed(global) {
  function parseYoutubeVideoId(url) {
    if (!url || typeof url !== 'string') return '';
    const trimmed = url.trim();
    if (!trimmed) return '';

    try {
      const parsed = new URL(trimmed);
      const host = parsed.hostname.replace(/^www\./, '');

      if (host === 'youtu.be') {
        const id = parsed.pathname.replace(/^\//, '').split('/')[0];
        return /^[\w-]{11}$/.test(id) ? id : '';
      }

      if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
        if (parsed.pathname === '/watch') {
          const id = parsed.searchParams.get('v') || '';
          return /^[\w-]{11}$/.test(id) ? id : '';
        }
        const parts = parsed.pathname.split('/').filter(Boolean);
        if (parts[0] === 'embed' || parts[0] === 'shorts' || parts[0] === 'live') {
          const id = parts[1] || '';
          return /^[\w-]{11}$/.test(id) ? id : '';
        }
      }
    } catch {
      return '';
    }
    return '';
  }

  function youtubeWatchUrl(videoId) {
    if (!videoId) return '';
    return `https://www.youtube.com/watch?v=${videoId}`;
  }

  function youtubeEmbedSrc(videoId) {
    if (!videoId) return '';
    return `https://www.youtube-nocookie.com/embed/${videoId}`;
  }

  global.YoutubeEmbed = {
    parseYoutubeVideoId,
    youtubeWatchUrl,
    youtubeEmbedSrc,
  };
})(typeof window !== 'undefined' ? window : globalThis);
