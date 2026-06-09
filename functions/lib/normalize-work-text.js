/** 概要・ストーリー: 余分な空白を整理し、「ラベル：」の手前で段落分け */
export function normalizeStory(text) {
  if (!text) return '';
  const oneLine = String(text)
    .replace(/\u200b/g, '')
    .split('\n')
    .map((line) => line.replace(/^[\s　]+|[\s　]+$/g, ''))
    .filter((line) => line.length > 0)
    .join(' ')
    .replace(/[\s　]{2,}/g, ' ')
    .trim();

  return oneLine
    .replace(/ (?=[^\s。、]{1,8}：)/g, '\n\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

const PROSE_SECTION_TITLES = new Set(['構成', 'ストーリー', '制作背景', 'テーマ', '背景']);
const LYRICS_SECTION_TITLES = new Set(['歌詞', '語り']);

function normalizeSectionBody(title, body) {
  if (PROSE_SECTION_TITLES.has(title)) return normalizeProse(body);
  if (LYRICS_SECTION_TITLES.has(title)) return normalizeBody(body).replace(/\n\n+/g, '\n');
  return normalizeBody(body);
}

/** 構成・ストーリー等: 段落内の折り返し改行を結合 */
export function normalizeProse(text) {
  if (!text) return '';
  return normalizeBody(text)
    .split('\n\n')
    .map((block) => block.split('\n').join(''))
    .join('\n\n');
}

/** 歌詞・語り等: 行末空白除去、空行の連続を1つに、先頭の全角スペース除去 */
export function normalizeBody(text) {
  if (!text) return '';
  const lines = String(text)
    .replace(/\u200b/g, '')
    .split('\n')
    .map((line) => line.replace(/^[\s　]+/, '').replace(/[\s　]+$/, ''));

  const out = [];
  let prevEmpty = false;
  for (const line of lines) {
    const empty = line.length === 0;
    if (empty) {
      if (!prevEmpty) out.push('');
      prevEmpty = true;
    } else {
      out.push(line);
      prevEmpty = false;
    }
  }
  while (out.length && out[0] === '') out.shift();
  while (out.length && out[out.length - 1] === '') out.pop();
  return out.join('\n');
}

/** 作品オブジェクトのテキストフィールドを正規化 */
export function normalizeWork(work) {
  if (!work || typeof work !== 'object') return work;
  const w = { ...work };
  if (typeof w.story === 'string') w.story = normalizeStory(w.story);
  if (typeof w.body === 'string' && w.body) w.body = normalizeBody(w.body);
  if (Array.isArray(w.detailSections)) {
    w.detailSections = w.detailSections.map((s) => {
      if (!s || typeof s.body !== 'string') return s;
      const body = normalizeSectionBody(s.title, s.body);
      return { ...s, body };
    });
  }
  return w;
}
