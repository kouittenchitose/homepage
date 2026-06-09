/**
 * 内容メモ.md から作品データを抽出し
 * functions/lib/default-works-full.js を生成する（開発時のみ実行）
 *
 *   node scripts/build-default-works.mjs [path/to/内容メモ.md] [path/to/memo.md]
 *
 * 第2引数は補足メモ（省略時は OneDrive の memo.md を自動参照）
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { normalizeStory, normalizeBody, normalizeProse } from '../functions/lib/normalize-work-text.js';

const PROSE_SECTION_TITLES = new Set(['構成', 'ストーリー', '制作背景', 'テーマ', '背景']);
const LYRICS_SECTION_TITLES = new Set(['歌詞', '語り']);

const __dirname = dirname(fileURLToPath(import.meta.url));
const memoPath = process.argv[2] || join(process.env.HOME || '', 'Downloads/内容メモ.md');
const defaultExtraMemo = join(
  process.env.HOME || '',
  'Library/CloudStorage/OneDrive-photon.chitose.ac.jp/memo.md'
);
const extraMemoPath = process.argv[3] || (existsSync(defaultExtraMemo) ? defaultExtraMemo : '');

const BASE = [
  {
    id: 'w2025',
    year: '2025',
    title: '一鳳（かげは）',
    awards: [],
  },
  {
    id: 'w2024',
    year: '2024',
    title: '臨剋（りんこく）',
    awards: ['第33回YOSAKOIソーラン祭り U-40 優秀賞'],
  },
  {
    id: 'w2023',
    year: '2023',
    title: '紲伊（せつか）',
    awards: [],
  },
  {
    id: 'w2022',
    year: '2022',
    title: '啓天（ひぞら）',
    awards: ['第25回みちのくYOSAKOIまつり ファイナル 第3位 仙台市長賞'],
  },
  {
    id: 'w2021',
    year: '2021',
    title: '光櫛（れいき）',
    awards: [],
  },
  {
    id: 'w2020',
    year: '2020',
    title: '燦華（さんか）',
    awards: [],
  },
  {
    id: 'w2019',
    year: '2019',
    title: '黎明（しののめ）',
    awards: ['第21回ちとせトーナメント セミトーナメント ベスト6'],
  },
  {
    id: 'w2018',
    year: '2018',
    title: '嵐奏（らんか）',
    awards: ['第20回ちとせトーナメント ベスト16', '第21回みちのくYOSAKOIまつり ファイナル 第4位'],
  },
  {
    id: 'w2017',
    year: '2017',
    title: '灼耀（あすか）',
    awards: [
      '第26回YOSAKOIソーラン祭り 敢闘賞',
      '第19回ちとせトーナメント ベスト8 レラ賞',
      '第20回みちのくYOSAKOIまつり ファイナル 第3位 仙台市長賞',
    ],
  },
  {
    id: 'w2016',
    year: '2016',
    title: '神瑞（かずい）',
    awards: [
      '第25回YOSAKOIソーラン祭り セミファイナル進出',
      '第26回石狩川フェスティバル水祭 準グランプリ',
      '第19回みちのくYOSAKOIまつり ファイナル 第4位',
    ],
  },
  {
    id: 'w2015',
    year: '2015',
    title: '嵩音（かさね）',
    awards: [
      '第24回YOSAKOIソーラン祭り セミファイナル 第3位',
      '第25回石狩川フェスティバル水祭 王座',
      '第17回ちとせトーナメント ベスト16',
      '第18回みちのくYOSAKOIまつり ファイナル進出 『第7位』',
    ],
  },
  {
    id: 'w2014',
    year: '2014',
    title: '神煒（しんき）',
    awards: [
      '第23回YOSAKOIソーラン祭り セミファイナル 第3位',
      '第24回石狩川フェスティバル水祭 王座',
      '第16回ちとせトーナメント ベスト8',
      '第16回上川中央支部大会 準大賞',
    ],
  },
  {
    id: 'w2013',
    year: '2013',
    title: 'ラマッタ・クリムセ',
    awards: ['第22回YOSAKOIソーラン祭り 一次審査員賞', '第15回ちとせトーナメント 優勝', '第15回上川中央支部大会 大賞'],
  },
  {
    id: 'w2012',
    year: '2012',
    title: '晶華（しょうか）',
    awards: ['第21回YOSAKOIソーラン祭り セミファイナル 第4位', '第14回ちとせトーナメント 優勝', '第14回上川中央支部大会 大賞'],
  },
  {
    id: 'w2011',
    year: '2011',
    title: '花神風（かしんふう）',
    awards: ['第20回YOSAKOIソーラン祭り 一次審査員賞', '第13回上川中央支部大会 大賞'],
  },
  {
    id: 'w2010k',
    year: '2010',
    title: '光芒一閃（こうぼういっせん）',
    awards: [],
  },
  {
    id: 'w2010',
    year: '2010',
    title: '依処（よすが）',
    awards: ['第19回YOSAKOIソーラン祭り 一次審査員賞'],
  },
  {
    id: 'w2009',
    year: '2009',
    title: '紬（つむぎ）',
    awards: ['第18回YOSAKOIソーラン祭り セミファイナル進出 第9位'],
  },
  {
    id: 'w2008',
    year: '2008',
    title: '紲（きずな）',
    awards: ['第17回YOSAKOIソーラン祭り 新人賞', '第17回YOSAKOIソーラン祭り 敢闘賞'],
  },
  {
    id: 'w2007',
    year: '2007',
    title: '桜の刻（さくらのとき）',
    story:
      '夕張の木、桜。一度夢を失った者達が、山間の夕張の丘でいつか果たしたいと誓った約束を唄った曲。本祭に出る術を失った自分達と破綻した夕張市の姿を重ね、手を取り合うことで、今は叶わぬ夢をいつか叶える希望を持つ姿を表現した作品。',
    awards: [],
  },
];

/** メモ内のマーカー行や画像ファイル名を除いてテキストを整形 */
function cleanRaw(text) {
  if (!text) return '';
  return text
    .replace(/\u200b/g, '')
    .split('\n')
    .filter((line) => {
      const t = line.trim();
      if (!t) return true;
      if (/\.(png|jpg|jpeg|gif|webp)$/i.test(t)) return false;
      if (t === 'image.png' || t.startsWith('スクリーンショット') || t.startsWith('よさこい_')) return false;
      if (t.startsWith('© ') || t.includes('Wix.com')) return false;
      if (t === '作品名' || t === '----------') return false;
      return true;
    })
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function sliceBetween(raw, start, end) {
  const i = raw.indexOf(start);
  if (i < 0) return '';
  const from = i + start.length;
  if (!end) return raw.slice(from);
  const j = raw.indexOf(end, from);
  if (j < 0) return raw.slice(from);
  return raw.slice(from, j);
}

/** 複数パターンのうち最も早い出現位置を返す */
function findFirst(text, patterns) {
  let best = -1;
  for (const p of patterns) {
    const re = typeof p === 'string' ? new RegExp(p, 'm') : p;
    const m = text.search(re);
    if (m >= 0 && (best < 0 || m < best)) best = m;
  }
  return best;
}

function sliceAt(text, index) {
  if (index < 0) return '';
  return cleanRaw(text.slice(index));
}

function sliceBefore(text, index) {
  if (index < 0) return cleanRaw(text);
  return cleanRaw(text.slice(0, index));
}

function section(title, body) {
  const cleaned = cleanRaw(body);
  let b;
  if (PROSE_SECTION_TITLES.has(title)) b = normalizeProse(cleaned);
  else if (LYRICS_SECTION_TITLES.has(title)) b = normalizeBody(cleaned).replace(/\n\n+/g, '\n');
  else b = normalizeBody(cleaned);
  if (!b) return null;
  return { title, body: b };
}

function compactSections(sections) {
  return sections.filter(Boolean);
}

function stripMarkerPrefix(text, markers) {
  let t = text.trim();
  for (const m of markers) {
    t = t.replace(m, '');
  }
  return t.trim();
}

/** <歌詞> / 歌詞 と <語り> / 【語り】 / 語り で分割 */
function splitLyricsNarration(chunk) {
  const lyricsIdx = findFirst(chunk, [/<歌詞>/, /\n歌詞\n/, /\n歌詞\s*\n/]);
  const narrIdx = findFirst(chunk, [/<語り>/, /【語り】/, /\n語り\n/, /\n語り\s*\n/]);
  const sections = [];
  if (lyricsIdx >= 0) {
    const lyricsEnd = narrIdx > lyricsIdx ? narrIdx : chunk.length;
    const lyrics = stripMarkerPrefix(chunk.slice(lyricsIdx, lyricsEnd), [/^<歌詞>\s*/, /^歌詞\s*/]);
    sections.push(section('歌詞', lyrics));
  }
  if (narrIdx >= 0) {
    const narr = stripMarkerPrefix(chunk.slice(narrIdx), [/^<語り>\s*/, /^【語り】\s*/, /^語り\s*/]);
    sections.push(section('語り', narr));
  }
  return sections;
}

function splitStoryIntro(intro, splitAt) {
  const idx = intro.indexOf(splitAt);
  if (idx < 0) return { story: intro, body: '' };
  return {
    story: intro.slice(0, idx).trim(),
    body: intro.slice(idx).trim(),
  };
}

/** 詳細情報なし — タイトル（＋受賞歴）のみ表示 */
const TITLE_ONLY_IDS = new Set(['w2011', 'w2012', 'w2008', 'w2009', 'w2010']);

function buildFromMemo(memoRaw) {
  const out = {};

  // 一鳳
  {
    const chunk = cleanRaw(sliceBetween(memoRaw, '一鳳＜かげは＞', '臨剋＜りんこく＞'));
    const lyricsIdx = findFirst(chunk, ['<歌詞>']);
    out.w2025 = {
      story: sliceBefore(chunk, lyricsIdx),
      detailSections: splitLyricsNarration(chunk),
    };
  }

  // 臨剋
  {
    const chunk = cleanRaw(sliceBetween(memoRaw, '臨剋＜りんこく＞', '紲伊＜せつか＞'));
    const lyricsIdx = findFirst(chunk, ['<歌詞>']);
    out.w2024 = {
      story: sliceBefore(chunk, lyricsIdx),
      detailSections: splitLyricsNarration(chunk),
    };
  }

  // 紲伊
  {
    const chunk = cleanRaw(sliceBetween(memoRaw, '紲伊＜せつか＞', '作品名'));
    const lyricsIdx = findFirst(chunk, ['<歌詞>']);
    out.w2023 = {
      story: sliceBefore(chunk, lyricsIdx),
      detailSections: splitLyricsNarration(chunk),
    };
  }

  // 啓天
  {
    const chunk = cleanRaw(sliceBetween(memoRaw, '『啓天-ひぞら-』', '光櫛〈れいき〉'));
    if (chunk.length > 30) {
      out.w2022 = buildHizoraWork(chunk);
    }
  }

  // 光櫛
  {
    const chunk = cleanRaw(sliceBetween(memoRaw, '光櫛〈れいき〉', '燦華〈さんか〉'));
    if (chunk.length > 30) {
      out.w2021 = buildReikiWork(chunk);
    }
  }

  // 燦華
  {
    const chunk = cleanRaw(sliceBetween(memoRaw, '燦華〈さんか〉', '黎明<しののめ>'));
    if (chunk.length > 30) {
      out.w2020 = buildSankaWork(chunk);
    }
  }

  // 黎明
  {
    const chunk = cleanRaw(sliceBetween(memoRaw, '黎明<しののめ>', '嵐奏＜らんか＞'));
    if (chunk.length > 30) {
      out.w2019 = buildShinonomeWork(chunk);
    }
  }

  // 嵐奏
  {
    const chunk = cleanRaw(sliceBetween(memoRaw, '嵐奏＜らんか＞', '灼耀<あすか>'));
    if (chunk.length > 30) {
      out.w2018 = buildRankaWork(chunk);
    }
  }

  // 灼耀
  {
    const chunk = cleanRaw(sliceBetween(memoRaw, '灼耀<あすか>', '神瑞<かずい>'));
    if (chunk.length > 30) {
      out.w2017 = buildAsukaWork(chunk);
    }
  }

  // 神瑞
  {
    const chunk = cleanRaw(sliceBetween(memoRaw, '神瑞<かずい>', '嵩音＜かさね＞'));
    if (chunk.length > 30) {
      out.w2016 = buildKazuiWork(chunk);
    }
  }

  // 嵩音
  {
    const chunk = cleanRaw(sliceBetween(memoRaw, '嵩音＜かさね＞', '神偉<sinki>'));
    if (chunk.length > 30) {
      out.w2015 = buildKasaneWork(chunk);
    }
  }

  // 神煒
  {
    const chunk = cleanRaw(sliceBetween(memoRaw, '神偉<sinki>', 'ラマッタ・クリムセ'));
    if (chunk.length > 30) {
      out.w2014 = buildShinkiWork(chunk);
    }
  }

  // ラマッタ・クリムセ
  {
    const chunk = cleanRaw(sliceBetween(memoRaw, 'ラマッタ・クリムセ', '\n2012\n'));
    if (chunk.length > 30) {
      out.w2013 = buildRamattaWork(chunk);
    }
  }

  // 光芒一閃（内容メモ内）
  {
    const chunk = cleanRaw('光芒一閃' + sliceBetween(memoRaw, '光芒一閃', '２０１０年'));
    if (chunk.length > 30) {
      out.w2010k = buildKoubouWork(chunk);
    }
  }

  // 桜の刻（内容メモ内）
  {
    const chunk = cleanRaw(sliceBetween(memoRaw, '桜の刻\n<さくらのとき>', '----------'));
    if (chunk && chunk.length > 30) {
      out.w2007 = buildSakuraWork(chunk);
    }
  }

  return out;
}

/** 桜の刻（2007・幻の作品）— 内容メモ / memo.md 共通 */
function buildSakuraWork(chunk) {
  const lyricsIdx = findFirst(chunk, [/<歌詞>/, /\n歌詞\n/, /​歌詞\n/]);
  const phantomIdx = findFirst(chunk, ['幻の作品']);
  const storyIdx = findFirst(chunk, ['ストーリー']);

  let story = '';
  if (storyIdx >= 0) {
    const storyEnd = phantomIdx > storyIdx ? phantomIdx : lyricsIdx > storyIdx ? lyricsIdx : chunk.length;
    story = chunk
      .slice(storyIdx, storyEnd)
      .replace(/^ストーリー\s*/, '')
      .trim();
  } else {
    story = sliceBefore(chunk, phantomIdx >= 0 ? phantomIdx : lyricsIdx);
  }

  let background = '';
  if (phantomIdx >= 0) {
    const bgEnd = lyricsIdx > phantomIdx ? lyricsIdx : chunk.length;
    background = chunk.slice(phantomIdx, bgEnd).replace(/^幻の作品\s*/, '');
  }

  return {
    story,
    detailSections: compactSections([
      section('背景', background),
      ...splitLyricsNarration(chunk),
    ]),
  };
}

/** 啓天（2022）— 『啓天-ひぞら-』 */
function buildHizoraWork(chunk) {
  const cleaned = chunk.replace(/^『啓天-ひぞら-』\s*/, '').replace(/^​?2022\s*/, '');
  const lyricsIdx = findFirst(cleaned, [/\n歌詞\n/, /^歌詞\n/m, /​歌詞\n/]);
  const story = sliceBefore(cleaned, lyricsIdx).replace(/読み方はそれぞれ読める字を組み合わせた\s*/, '');
  const lyricsChunk = lyricsIdx >= 0 ? cleaned.slice(lyricsIdx) : '';
  return {
    story,
    detailSections: splitLyricsNarration(lyricsChunk),
  };
}

/** 光櫛（2021）— 光櫛〈れいき〉 */
function buildReikiWork(chunk) {
  const cleaned = chunk.replace(/^​?2021\s*/, '').replace(/^光櫛〈れいき〉\s*/, '');
  const opIdx = findFirst(cleaned, ['【OP】']);
  const lyricsIdx = findFirst(cleaned, [/<歌詞>/, /\n歌詞\n/, /​歌詞\n/]);
  const themeLine = cleaned.match(/テーマ\*八雲の姫/)?.[0] || 'テーマ：八雲の姫';
  let structure = '';
  if (opIdx >= 0) {
    const end = lyricsIdx > opIdx ? lyricsIdx : cleaned.length;
    structure = cleaned.slice(opIdx, end);
  }
  return {
    story: `${themeLine}。2017年作品「灼耀」のスサノオのその後を描く、ヤマタノオロチ退治とクシナダヒメとの結婚までの物語。`,
    detailSections: compactSections([section('構成', structure), ...splitLyricsNarration(cleaned)]),
  };
}

/** 燦華（2020）— 燦華〈さんか〉 */
function buildSankaWork(chunk) {
  const cleaned = chunk.replace(/^​?2020\s*/, '').replace(/^燦華〈さんか〉\s*/, '');
  const structureIdx = findFirst(cleaned, ['【蕾】']);
  const structure = structureIdx >= 0 ? cleaned.slice(structureIdx) : cleaned;
  return {
    story:
      '物静かな秋の大地に蕾があり、季節外れの薄桃色の花を咲かせ人々を魅了する。冬の吹雪を越え、春には満開の桜が心に眠る記憶を呼び覚まし、宴の始まりへと導く生命の物語。',
    detailSections: compactSections([section('構成', structure)]),
  };
}

/** 黎明（2019）— 黎明<しののめ> */
function buildShinonomeWork(chunk) {
  const lyricsIdx = findFirst(chunk, [/<歌詞>/, /\n歌詞\n/, /​歌詞\n/]);
  const story = sliceBefore(chunk, lyricsIdx)
    .replace(/^黎明<しののめ>\s*/, '')
    .replace(/^2019\s*/, '');
  return {
    story,
    detailSections: splitLyricsNarration(chunk),
  };
}

/** 嵐奏（2018）— 嵐奏＜らんか＞ */
function buildRankaWork(chunk) {
  const lyricsIdx = findFirst(chunk, [/<歌詞>/, /\n歌詞\n/, /​歌詞\n/]);
  const story = sliceBefore(chunk, lyricsIdx)
    .replace(/^嵐奏＜らんか＞\s*/, '')
    .replace(/^2018\s*/, '');
  return {
    story,
    detailSections: splitLyricsNarration(chunk),
  };
}

/** 灼耀（2017）— 灼耀<あすか> */
function buildAsukaWork(chunk) {
  const storyIdx = findFirst(chunk, ['ストーリー', /​ストーリー/]);
  const lyricsIdx = findFirst(chunk, [/<歌詞>/, /\n歌詞\n/, /​歌詞\n/]);
  let themePart = storyIdx >= 0 ? sliceBefore(chunk, storyIdx) : sliceBefore(chunk, lyricsIdx);
  themePart = themePart.replace(/^灼耀<あすか>\s*/, '').replace(/^2017\s*/, '');
  let storyBody = '';
  if (storyIdx >= 0) {
    const end = lyricsIdx > storyIdx ? lyricsIdx : chunk.length;
    storyBody = chunk.slice(storyIdx, end).replace(/^​?ストーリー\s*/, '');
  }
  return {
    story: themePart,
    detailSections: compactSections([section('ストーリー', storyBody), ...splitLyricsNarration(chunk)]),
  };
}

/** 神瑞（2016）— 神瑞<かずい> */
function buildKazuiWork(chunk) {
  const lyricsIdx = findFirst(chunk, [/<歌詞>/, /\n歌詞\n/, /​歌詞\n/]);
  const intro = sliceBefore(chunk, lyricsIdx)
    .replace(/^神瑞<かずい>\s*/, '')
    .replace(/^2016\s*/, '');
  const { story: storyIntro, body: storyBody } = splitStoryIntro(intro, '未だこの地上に');
  return {
    story: storyIntro,
    detailSections: compactSections([section('ストーリー', storyBody), ...splitLyricsNarration(chunk)]),
  };
}

/** 嵩音（2015）— 嵩音＜かさね＞ */
function buildKasaneWork(chunk) {
  const storyIdx = findFirst(chunk, ['ストーリー']);
  const lyricsIdx = findFirst(chunk, [/<歌詞>/, /\n歌詞\n/, /​歌詞\n/]);
  let themePart = storyIdx >= 0 ? sliceBefore(chunk, storyIdx) : sliceBefore(chunk, lyricsIdx);
  themePart = themePart.replace(/^嵩音＜かさね＞\s*/, '').replace(/^2015\s*/, '');
  let storyBody = '';
  if (storyIdx >= 0) {
    const end = lyricsIdx > storyIdx ? lyricsIdx : chunk.length;
    storyBody = chunk.slice(storyIdx, end).replace(/^ストーリー\s*/, '');
  }
  return {
    story: themePart,
    detailSections: compactSections([section('ストーリー', storyBody), ...splitLyricsNarration(chunk)]),
  };
}

/** 神煒（2014）— 神偉<sinki> */
function buildShinkiWork(chunk) {
  const lyricsIdx = findFirst(chunk, [/<歌詞>/, /\n歌詞\n/, /​歌詞\n/]);
  const intro = sliceBefore(chunk, lyricsIdx)
    .replace(/^神偉<sinki>\s*/, '')
    .replace(/^2014\s*/, '');
  const { story: storyIntro, body: storyBody } = splitStoryIntro(intro, 'このカンナカムイが自ら見惚れて');
  return {
    story: storyIntro,
    detailSections: compactSections([section('ストーリー', storyBody), ...splitLyricsNarration(chunk)]),
  };
}

/** ラマッタ・クリムセ（2013） */
function buildRamattaWork(chunk) {
  const lyricsIdx = findFirst(chunk, [/<歌詞>/, /\n歌詞\n/, /​歌詞\n/]);
  const story = sliceBefore(chunk, lyricsIdx).replace(/^ラマッタ・クリムセ\s*/, '');
  return {
    story,
    detailSections: splitLyricsNarration(chunk),
  };
}

/** 光芒一閃 — 内容メモ / OneDrive memo.md */
function buildKoubouWork(chunk) {
  const themeIdx = findFirst(chunk, ['​テーマ', /\nテーマ\n/]);
  const lyricsIdx = findFirst(chunk, ['​歌詞', /\n歌詞\n/]);
  const productionEnd = themeIdx >= 0 ? themeIdx : lyricsIdx >= 0 ? lyricsIdx : chunk.length;
  const production = chunk.slice(0, productionEnd).replace(/^光芒一閃[\s\S]*?制作ストーリー\s*/, '');

  let theme = '';
  if (themeIdx >= 0) {
    const end = lyricsIdx > themeIdx ? lyricsIdx : chunk.length;
    theme = stripMarkerPrefix(chunk.slice(themeIdx, end), [/^​?テーマ\s*/]);
  }

  return {
    story:
      '「光芒」はきらめく光の穂先、「一閃」は瞬時のきらめき。合同チーム解散後、光一天単体で演舞できる作品がなく学生チャレンジプログラムで企画された、初の単体作品。',
    detailSections: compactSections([
      section('制作背景', production),
      section('テーマ', theme),
      ...splitLyricsNarration(chunk),
    ]),
  };
}

function buildFromExtraMemo(memoRaw) {
  const out = {};
  if (!memoRaw) return out;

  if (/『啓天-ひぞら-』/.test(memoRaw)) {
    const chunk = cleanRaw(memoRaw.slice(memoRaw.indexOf('『啓天-ひぞら-』')));
    if (chunk.length > 30) {
      out.w2022 = buildHizoraWork(chunk);
    }
  }

  if (/光櫛〈れいき〉/.test(memoRaw)) {
    const chunk = cleanRaw(memoRaw.slice(memoRaw.indexOf('光櫛〈れいき〉')));
    if (chunk.length > 30) {
      out.w2021 = buildReikiWork(chunk);
    }
  }

  if (/燦華〈さんか〉/.test(memoRaw)) {
    const chunk = cleanRaw(memoRaw.slice(memoRaw.indexOf('燦華〈さんか〉')));
    if (chunk.length > 30) {
      out.w2020 = buildSankaWork(chunk);
    }
  }

  if (/黎明<しののめ>/.test(memoRaw)) {
    const chunk = cleanRaw(memoRaw.slice(memoRaw.indexOf('黎明<しののめ>')));
    if (chunk.length > 30) {
      out.w2019 = buildShinonomeWork(chunk);
    }
  }

  if (/嵐奏＜らんか＞/.test(memoRaw)) {
    const chunk = cleanRaw(memoRaw.slice(memoRaw.indexOf('嵐奏＜らんか＞')));
    if (chunk.length > 30) {
      out.w2018 = buildRankaWork(chunk);
    }
  }

  if (/灼耀<あすか>/.test(memoRaw)) {
    const chunk = cleanRaw(memoRaw.slice(memoRaw.indexOf('灼耀<あすか>')));
    if (chunk.length > 30) {
      out.w2017 = buildAsukaWork(chunk);
    }
  }

  if (/神瑞<かずい>/.test(memoRaw)) {
    const chunk = cleanRaw(memoRaw.slice(memoRaw.indexOf('神瑞<かずい>')));
    if (chunk.length > 30) {
      out.w2016 = buildKazuiWork(chunk);
    }
  }

  if (/嵩音＜かさね＞/.test(memoRaw)) {
    const chunk = cleanRaw(memoRaw.slice(memoRaw.indexOf('嵩音＜かさね＞')));
    if (chunk.length > 30) {
      out.w2015 = buildKasaneWork(chunk);
    }
  }

  if (/神偉<sinki>/.test(memoRaw)) {
    const chunk = cleanRaw(memoRaw.slice(memoRaw.indexOf('神偉<sinki>')));
    if (chunk.length > 30) {
      out.w2014 = buildShinkiWork(chunk);
    }
  }

  if (/ラマッタ・クリムセ/.test(memoRaw)) {
    const chunk = cleanRaw(memoRaw.slice(memoRaw.indexOf('ラマッタ・クリムセ')));
    if (chunk.length > 30) {
      out.w2013 = buildRamattaWork(chunk);
    }
  }

  if (/光芒一閃/.test(memoRaw)) {
    const chunk = cleanRaw(memoRaw.slice(memoRaw.indexOf('光芒一閃')));
    if (chunk.length > 30) {
      out.w2010k = buildKoubouWork(chunk);
    }
  }

  if (/桜の刻/.test(memoRaw)) {
    const chunk = cleanRaw(memoRaw.slice(memoRaw.indexOf('桜の刻')));
    if (chunk.length > 30) {
      out.w2007 = buildSakuraWork(chunk);
    }
  }

  return out;
}

let memoRaw = '';
try {
  memoRaw = readFileSync(memoPath, 'utf8');
} catch (e) {
  console.warn('メモファイルが読めません:', memoPath, '- 既存ストーリーのみ生成します');
}

let extraMemoRaw = '';
if (extraMemoPath) {
  try {
    extraMemoRaw = readFileSync(extraMemoPath, 'utf8');
    console.log('補足メモ:', extraMemoPath);
  } catch (e) {
    console.warn('補足メモが読めません:', extraMemoPath);
  }
}

const parsed = {
  ...(memoRaw ? buildFromMemo(memoRaw) : {}),
  ...buildFromExtraMemo(extraMemoRaw),
};

const outWorks = BASE.map((w) => {
  const work = {
    ...w,
    image: '',
    awards: w.awards,
    body: '',
  };

  if (TITLE_ONLY_IDS.has(w.id)) {
    work.story = '';
    return work;
  }

  const p = parsed[w.id];
  const story = p?.story || w.story || '';
  work.story = normalizeStory(cleanRaw(story));
  const detailSections = p?.detailSections?.length ? p.detailSections : undefined;
  if (detailSections?.length) {
    work.detailSections = detailSections;
  }
  return work;
});

const outPath = join(__dirname, '../functions/lib/default-works-full.js');
writeFileSync(
  outPath,
  `// 自動生成: node scripts/build-default-works.mjs\n// メモを更新したら再実行してください。\nexport const defaultWorks = ${JSON.stringify(outWorks, null, 2)};\n`,
  'utf8'
);
console.log('Wrote', outPath, 'works:', outWorks.length);

// works.html のフォールバック用概要文を同期
const worksHtmlPath = join(__dirname, '../works.html');
try {
  let html = readFileSync(worksHtmlPath, 'utf8');
  const listBlock = outWorks
    .map((w) => {
      const storyOneLine = normalizeStory(w.story);
      const awardsLines =
        w.awards.length > 0
          ? `\n        awards: [${w.awards.map((a) => `\n          ${JSON.stringify(a)}`).join(',')}\n        ]`
          : '\n        awards: []';
      return `      {
        id: ${JSON.stringify(w.id)}, year: ${JSON.stringify(w.year)}, title: ${JSON.stringify(w.title)},
        story: ${JSON.stringify(storyOneLine)},${awardsLines}
      }`;
    })
    .join(',\n');
  const replaced = html.replace(
    /const defaultWorks = \[[\s\S]*?\];\s*\n\s*async function init/,
    `const defaultWorks = [\n${listBlock}\n    ];\n\n    async function init`
  );
  if (replaced !== html) {
    writeFileSync(worksHtmlPath, replaced, 'utf8');
    console.log('Synced works.html fallback stories');
  }
} catch (e) {
  console.warn('works.html の同期をスキップ:', e.message);
}
