// functions/api/content.js
import { defaultWorks } from '../lib/default-works-full.js';
import { mergeWorksWithDefaults } from '../lib/merge-works.js';

const defaultHistory = [
  { year: "2003年", content: "千歳科学技術大学YOSAKOIソーランサークルとして創立。「恭賀千極と風 feat.千歳科学技術大学」として活動。" },
  { year: "2005年", content: "大学公認の部活動へと昇格。千歳科学技術大学YOSAKOIソーラン部「光一天」として独立。" },
  { year: "2006年", content: "YOSAKOIソーラン祭に「光一天」で初出場。同年、夕張学生連盟『WARM』加盟。" },
  { year: "2007年", content: "夕張学生連盟『WARM』として本祭出場。同年10月夕張学生連盟『WARM』脱退。" },
  { year: "2008年", content: "「遨～すさび～」で本祭出場。" },
  { year: "2009年", content: "合同チーム「遨～すさび～＆光一天」が形成される。" },
  { year: "2015年", content: "千歳科学技術大学 稜輝祭にて、独立10周年記念演舞を行う。" },
  { year: "2017年", content: "「遨～すさび～」と独立し、千歳科学技術大学YOSAKOIソーラン部「光一天」として活動開始。" }
];
const defaultAwards = [
  { year: "2024年 『臨剋（りんこく）』", text: "第33回YOSAKOIソーラン祭り U-40 『優秀賞』" },
  { year: "2022年 『啓天（ひぞら）』", text: "第25回みちのくYOSAKOIまつり ファイナル進出 『第3位』仙台市長賞" },
  { year: "2019年 『黎明（しののめ）』", text: "第21回ちとせトーナメント セミトーナメント 『ベスト6』" },
  { year: "2018年 『嵐奏（らんか）』", text: "第20回ちとせトーナメント 『ベスト16』\n第21回みちのくYOSAKOIまつり ファイナル進出 『第4位』" },
  { year: "2017年 『灼耀（あすか）』", text: "第26回YOSAKOIソーラン祭り 『敢闘賞』\n第19回ちとせトーナメント 『ベスト8』『レラ賞』\n第20回みちのくYOSAKOIまつり ファイナル進出 『第3位』仙台市長賞" },
  { year: "2016年 『神瑞（かずい）』", text: "第25回YOSAKOIソーラン祭り セミファイナル進出\n第26回石狩川フェスティバル水祭 『準グランプリ』\n第19回みちのくYOSAKOIまつり ファイナル進出 『第4位』" },
  { year: "2015年 『嵩音（かさね）』", text: "第24回YOSAKOIソーラン祭り セミファイナル 第3位\n第25回石狩川フェスティバル水祭 『王座』\n第17回ちとせトーナメント 『ベスト16』\n第18回みちのくYOSAKOIまつり ファイナル進出 『第7位』" },
  { year: "2014年 『神煒（しんき）』", text: "第23回YOSAKOIソーラン祭り セミファイナル 第3位\n第24回石狩川フェスティバル水祭 『王座』\n第16回ちとせトーナメント 『ベスト8』\n第16回上川中央支部大会 『準大賞』" },
  { year: "2013年 『ラマッタクリムセ』", text: "第22回YOSAKOIソーラン祭り 『一次審査員賞』\n第15回ちとせトーナメント 『優勝』\n第15回上川中央支部大会 『大賞』" },
  { year: "2012年 『晶華(しょうか)』", text: "第21回YOSAKOIソーラン祭り セミファイナル進出 『第4位』\n第14回ちとせトーナメント 『優勝』\n第14回上川中央支部大会 『大賞』" },
  { year: "2011年 『花神風（かしんふう）』", text: "第20回YOSAKOIソーラン祭り 『一次審査員賞』\n第13回上川中央支部大会 『大賞』" },
  { year: "2010年 『依処(よすが)』", text: "第19回YOSAKOIソーラン祭り 『一次審査員賞』" },
  { year: "2009年 『紬（つむぎ）』", text: "第18回YOSAKOIソーラン祭り セミファイナル進出 『第9位』" },
  { year: "2008年 『紲（きずな）』", text: "第17回YOSAKOIソーラン祭り 『新人賞』『敢闘賞』" }
];

async function readPublishedConfig(bucket) {
  const obj = await bucket.get('data/anniv-config.json');
  if (!obj) return { published: false };
  try {
    const data = JSON.parse(await obj.text());
    return { published: !!(data && data.published) };
  } catch {
    return { published: false };
  }
}

const cacheHeaders = { "Content-Type": "application/json", "Cache-Control": "public, max-age=0, must-revalidate" };
const computeEtag = (text) => {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0;
  }
  return `"${(hash >>> 0).toString(16)}"`;
};
const createJsonResponse = (body, request, status = 200) => {
  const etag = computeEtag(body);
  const headers = { ...cacheHeaders, ETag: etag };
  if (request.headers.get('If-None-Match') === etag) {
    return new Response(null, { status: 304, headers });
  }
  return new Response(body, { status, headers });
};

export async function onRequest(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const type = url.searchParams.get('type') || 'news';
  const id = url.searchParams.get('id');

  try {
    const obj = await env.MEDIA_BUCKET.get(`data/${type}.json`);
    if (!obj) {
      if (type === 'about') {
        await env.MEDIA_BUCKET.put('data/about.json', JSON.stringify({ history: defaultHistory, awards: defaultAwards }), { httpMetadata: { contentType: 'application/json' } });
        return createJsonResponse(JSON.stringify({ history: defaultHistory, awards: defaultAwards }), request);
      }
      if (type === 'works') {
        await env.MEDIA_BUCKET.put('data/works.json', JSON.stringify(defaultWorks), { httpMetadata: { contentType: 'application/json' } });
        if (id) {
          const item = defaultWorks.find(i => i.id === id);
          if (!item) return createJsonResponse(JSON.stringify({ error: "Not found" }), request, 404);
          return createJsonResponse(JSON.stringify(item), request);
        }
        return createJsonResponse(JSON.stringify(defaultWorks), request);
      }
      if (type === 'anniv-config') {
        const initial = { published: false };
        await env.MEDIA_BUCKET.put('data/anniv-config.json', JSON.stringify(initial), { httpMetadata: { contentType: 'application/json' } });
        return createJsonResponse(JSON.stringify(initial), request);
      }
      if (type === 'anniv') {
        const initial = { content: '' };
        await env.MEDIA_BUCKET.put('data/anniv.json', JSON.stringify(initial), { httpMetadata: { contentType: 'application/json' } });
        return createJsonResponse(JSON.stringify(initial), request);
      }
      if (type === 'sponsors') {
        const initial = { published: false, intro: '', items: [] };
        await env.MEDIA_BUCKET.put('data/sponsors.json', JSON.stringify(initial), { httpMetadata: { contentType: 'application/json' } });
        return createJsonResponse(JSON.stringify(initial), request);
      }
      return createJsonResponse('[]', request);
    }

    const dataStr = await obj.text();
    let data;
    try {
        data = JSON.parse(dataStr);
    } catch(e) {
        data = type === 'about' ? {} : [];
    }

    if (type === 'about') {
      if (!data.history || data.history.length === 0) data.history = defaultHistory;
      if (!data.awards || data.awards.length === 0) data.awards = defaultAwards;
      return createJsonResponse(JSON.stringify(data), request);
    }

    if (type === 'works') {
      data = mergeWorksWithDefaults(data, defaultWorks);
    }
    if (type === 'anniv-config') {
      if (!data || Array.isArray(data) || typeof data !== 'object') data = { published: false };
      if (typeof data.published !== 'boolean') data.published = false;
    }
    if (type === 'anniv') {
      if (!data || Array.isArray(data) || typeof data !== 'object') data = { content: '' };
      if (typeof data.content !== 'string') data.content = '';
      const annivConfig = await readPublishedConfig(env.MEDIA_BUCKET);
      if (!annivConfig.published) data = { content: '' };
    }
    if (type === 'sponsors') {
      if (!data || Array.isArray(data) || typeof data !== 'object') data = { published: false, intro: '', items: [] };
      if (typeof data.published !== 'boolean') data.published = false;
      if (typeof data.intro !== 'string') data.intro = '';
      if (!Array.isArray(data.items)) data.items = [];
      data.items = data.items
        .filter((it) => it && typeof it === 'object')
        .map((it) => ({
          name: String(it.name || '').trim(),
          url: String(it.url || '').trim(),
          logoUrl: String(it.logoUrl || '').trim()
        }))
        .filter((it) => it.name.length > 0);
      if (!data.published) data = { published: false, intro: '', items: [] };
    }

    if (id && Array.isArray(data)) {
        const item = data.find(i => i.id === id);
        if(!item) return createJsonResponse(JSON.stringify({error: "Not found"}), request, 404);
        return createJsonResponse(JSON.stringify(item), request);
    }

    if (type === 'news') {
        const query = url.searchParams.get('q');
        const pinnedOnly = url.searchParams.get('pinned') === 'true';
        const limit = Number(url.searchParams.get('limit')) || data.length;

        if (pinnedOnly) data = data.filter(i => i.pinned);
        if (query) {
            const q = query.toLowerCase();
            data = data.filter(i => (i.title+i.body+i.tag).toLowerCase().includes(q));
        }
        data = data.slice(0, limit);
    }

    return createJsonResponse(JSON.stringify(data), request);
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}
