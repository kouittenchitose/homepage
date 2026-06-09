/**
 * 作品詳細のセクション分解（レガシー本文 ↔ CMS の detailSections 共通処理）
 */
(function initWorkSections(global) {
  function stripMemoLine(text) {
    if (!text || typeof text !== 'string') return '';
    return text.replace(/【メモより：[^】]*】\s*/g, '').replace(/\r\n/g, '\n').trim();
  }

  function legacyBodyToSections(text) {
    const cleaned = stripMemoLine(text);
    if (!cleaned) return [];

    const markers = [];
    const angleRe = /<([^>\n]{1,80})>/g;
    let m;
    while ((m = angleRe.exec(cleaned)) !== null) {
      markers.push({ index: m.index, title: m[1].trim(), len: m[0].length });
    }

    if (markers.length > 0) {
      const parts = [];
      const intro = cleaned.slice(0, markers[0].index).trim();
      if (intro) parts.push({ title: 'テーマ・構成', body: intro });
      for (let i = 0; i < markers.length; i++) {
        const start = markers[i].index + markers[i].len;
        const end = i + 1 < markers.length ? markers[i + 1].index : cleaned.length;
        const body = cleaned.slice(start, end).trim();
        parts.push({ title: markers[i].title, body });
      }
      return parts.filter((p) => (p.title && p.title.length) || (p.body && p.body.length));
    }

    const kwSplit = cleaned.split(/\n\s*(?:歌詞|語り|ストーリー|テーマ)\s*[：:﹕]?\s*\n/i);
    if (kwSplit.length > 1) {
      const parts = [];
      const heads = cleaned.match(/\n\s*(歌詞|語り|ストーリー|テーマ)\s*[：:﹕]?\s*\n/gi);
      parts.push({ title: 'テーマ・構成', body: kwSplit[0].trim() });
      for (let i = 1; i < kwSplit.length; i++) {
        const h = heads && heads[i - 1] ? heads[i - 1].replace(/\n/g, '').replace(/[：:﹕]+$/, '').trim() : `パート${i}`;
        parts.push({ title: h, body: kwSplit[i].trim() });
      }
      return parts.filter((p) => p.body || p.title);
    }

    return [{ title: '詳細', body: cleaned }];
  }

  function workSectionsForWork(work) {
    if (!work || typeof work !== 'object') return [];
    const ds = work.detailSections;
    if (Array.isArray(ds) && ds.length > 0) {
      return ds
        .map((s) => ({
          title: String(s.title || '').trim(),
          body: typeof s.body === 'string' ? s.body : s.body == null ? '' : String(s.body),
        }))
        .filter((s) => s.title || s.body.trim());
    }
    return legacyBodyToSections(work.body || '');
  }

  global.WorkSections = {
    stripMemoLine,
    legacyBodyToSections,
    workSectionsForWork,
  };
})(typeof window !== 'undefined' ? window : globalThis);
