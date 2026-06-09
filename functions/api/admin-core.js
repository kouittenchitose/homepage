// functions/api/admin-core.js
import { defaultWorks } from '../lib/default-works-full.js';
import { mergeWorksWithDefaults } from '../lib/merge-works.js';

/** R2 の list はページ分割されるため、プレフィックス配下をすべて集める */
async function listAllObjectsWithPrefix(bucket, prefix) {
  const out = [];
  let cursor;
  let truncated = true;
  while (truncated) {
    const page = await bucket.list({ prefix, cursor });
    out.push(...(page.objects || []));
    truncated = page.truncated;
    cursor = page.cursor;
  }
  return out;
}

function sortFixedAssetsNewestFirst(objs, keyRegex) {
  return objs
    .filter((o) => keyRegex.test(o.key))
    .sort((a, b) => {
      const ta = new Date(a.uploaded || 0).getTime();
      const tb = new Date(b.uploaded || 0).getTime();
      if (tb !== ta) return tb - ta;
      return b.key.localeCompare(a.key);
    });
}

/** logo.* / hero-bg.* は常に1ファイルにそろえる（古い拡張子の残骸を削除） */
async function deleteOtherFixedSameFamily(bucket, keepKey) {
  let familyPrefix = null;
  if (keepKey.startsWith('assets/logo.')) familyPrefix = 'assets/logo.';
  else if (keepKey.startsWith('assets/hero-bg.')) familyPrefix = 'assets/hero-bg.';
  else return;
  const objs = await listAllObjectsWithPrefix(bucket, familyPrefix);
  for (const o of objs) {
    if (o.key !== keepKey) await bucket.delete(o.key);
  }
}

export async function onRequestPost(context) {
  const defaultAbout = {
    history: [
      { year: "2003年", content: "千歳科学技術大学YOSAKOIソーランサークルとして創立。「恭賀千極と風 feat.千歳科学技術大学」として活動。" },
      { year: "2005年", content: "大学公認の部活動へと昇格。千歳科学技術大学YOSAKOIソーラン部「光一天」として独立。" },
      { year: "2006年", content: "YOSAKOIソーラン祭に「光一天」で初出場。同年、夕張学生連盟『WARM』加盟。" },
      { year: "2007年", content: "夕張学生連盟『WARM』として本祭出場。同年10月夕張学生連盟『WARM』脱退。" },
      { year: "2008年", content: "「遨～すさび～」で本祭出場。" },
      { year: "2009年", content: "合同チーム「遨～すさび～＆光一天」が形成される。" },
      { year: "2015年", content: "千歳科学技術大学 稜輝祭にて、独立10周年記念演舞を行う。" },
      { year: "2017年", content: "「遨～すさび～」と独立し、千歳科学技術大学YOSAKOIソーラン部「光一天」として活動開始。" }
    ],
    awards: [
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
    ]
  };
  const { env, request } = context;
  const { user, pass, action, ...params } = await request.json();

  const bucket = env.MEDIA_BUCKET;
  const readJson = async (key) => {
    const obj = await bucket.get(key);
    if (!obj) return null;
    try { return JSON.parse(await obj.text()); } catch { return null; }
  };
  const writeJson = async (key, data) => {
    await bucket.put(key, JSON.stringify(data), { httpMetadata: { contentType: 'application/json' } });
    return data;
  };
  const getTrash = async () => {
    const trash = await readJson('data/trash.json');
    return Array.isArray(trash) ? trash : [];
  };
  const setTrash = async (trash) => writeJson('data/trash.json', trash);
  const restoreRecord = async (record) => {
    if (record.type === 'news' || record.type === 'works') {
      const file = await readJson(`data/${record.type}.json`) || [];
      const list = Array.isArray(file) ? file : [];
      const idx = list.findIndex(i => i.id === record.payload.id);
      if (idx >= 0) list[idx] = record.payload; else list.unshift(record.payload);
      
      if (record.type === 'news') {
        list.sort((a, b) => new Date(b.date) - new Date(a.date));
      } else if (record.type === 'works') {
        list.sort((a, b) => b.year - a.year);
      }
      
      await writeJson(`data/${record.type}.json`, list);
      // R2キャッシュパージや静的サイト生成のトリガーがある場合はここに追加
      return;
    }

    if (record.type === 'anniv-item') {
      const anniv = (await readJson('data/anniv.json')) || { published: false, content: '' };
      anniv.content = record.payload.content;
      await writeJson('data/anniv.json', anniv);
      return;
    }
    if (record.type === 'about-history' || record.type === 'about-awards') {
      const about = (await readJson('data/about.json')) || { history: [], awards: [] };
      about.history = about.history || [];
      about.awards = about.awards || [];
      if (record.type === 'about-history') {
        const idx = about.history.findIndex(i => i.year === record.payload.year && i.content === record.payload.content);
        if (idx < 0) about.history.unshift(record.payload); else about.history[idx] = record.payload;
      }
      if (record.type === 'about-awards') {
        const idx = about.awards.findIndex(i => i.year === record.payload.year && i.text === record.payload.text);
        if (idx < 0) about.awards.unshift(record.payload); else about.awards[idx] = record.payload;
      }
      await writeJson('data/about.json', about);
      return;
    }
    // unknown record types are ignored for restore
  };

  if (action === 'get-assets-map') {
    const objects = await listAllObjectsWithPrefix(env.MEDIA_BUCKET, 'assets/');
    const map = {};
    const logos = sortFixedAssetsNewestFirst(objects, /^assets\/logo\.[^/]+$/);
    const heroes = sortFixedAssetsNewestFirst(objects, /^assets\/hero-bg\.[^/]+$/);
    if (logos[0]) {
      const obj = logos[0];
      const version = encodeURIComponent(String(obj.httpEtag || obj.etag || obj.size || obj.uploaded || '1'));
      map.logo = encodeURI(`/media/${obj.key}?v=${version}`);
    }
    if (heroes[0]) {
      const obj = heroes[0];
      const version = encodeURIComponent(String(obj.httpEtag || obj.etag || obj.size || obj.uploaded || '1'));
      map.hero = encodeURI(`/media/${obj.key}?v=${version}`);
    }
    try {
      const siteObj = await env.MEDIA_BUCKET.get('data/site.json');
      if (siteObj) {
        const site = JSON.parse(await siteObj.text());
        if (site && typeof site.instagramPermalink === 'string' && site.instagramPermalink.trim()) {
          map.instagramPermalink = site.instagramPermalink.trim();
        }
      }
    } catch (_) {}
    return new Response(JSON.stringify(map), { headers: { "Content-Type": "application/json", "Cache-Control": "no-cache" } });
  }

  if (env.ADMIN_USER && env.ADMIN_PASSWORD) {
    if (user !== env.ADMIN_USER || pass !== env.ADMIN_PASSWORD) {
      return new Response(JSON.stringify({ error: "Auth Error" }), { status: 401 });
    }
  }

  try {
    if (action === 'ping') return new Response(JSON.stringify({ ok: true }));

    if (action === 'get-json') {
      const initial =
        params.file === 'about'
          ? defaultAbout
          : params.file === 'works'
            ? defaultWorks
            : params.file === 'site'
              ? { instagramPermalink: '' }
              : params.file === 'anniv'
                ? { content: '' }
                : params.file === 'anniv-config'
                  ? { published: false }
                  : params.file === 'sponsors'
                    ? { published: false, intro: '', items: [] }
                    : null;
      const obj = await bucket.get(`data/${params.file}.json`);
      if (!obj) {
        if (initial) {
          await writeJson(`data/${params.file}.json`, initial);
          return new Response(JSON.stringify(initial), { headers: { "Content-Type": "application/json" } });
        }
        if (params.file === 'trash') {
          await setTrash([]);
          return new Response(JSON.stringify([]), { headers: { "Content-Type": "application/json" } });
        }
        return new Response('[]', { headers: { "Content-Type": "application/json" } });
      }
      
      const text = await obj.text();
      try {
        const parsed = JSON.parse(text);
        // 作品やチーム紹介が空データになってしまっている場合は初期データで復元する
        if (initial) {
          const isEmptyArray = Array.isArray(parsed) && parsed.length === 0;
          const isEmptyObject = !Array.isArray(parsed) && Object.keys(parsed).length === 0;
          if (isEmptyArray || isEmptyObject) {
            await writeJson(`data/${params.file}.json`, initial);
            return new Response(JSON.stringify(initial), { headers: { "Content-Type": "application/json" } });
          }
          if (params.file === 'works') {
            const merged = mergeWorksWithDefaults(parsed, defaultWorks);
            return new Response(JSON.stringify(merged), { headers: { "Content-Type": "application/json" } });
          }
        }
      } catch (e) {}
      
      return new Response(text, { headers: { "Content-Type": "application/json" } });
    }

    if (action === 'save-json') {
      await bucket.put(`data/${params.file}.json`, JSON.stringify(params.data), {
        httpMetadata: { contentType: 'application/json' }
      });
      return new Response(JSON.stringify({ ok: true }));
    }

    if (action === 'get-trash') {
      const trash = await getTrash();
      return new Response(JSON.stringify(trash), { headers: { "Content-Type": "application/json" } });
    }

    if (action === 'move-to-trash') {
      const trash = await getTrash();
      trash.unshift(params.item);
      await setTrash(trash);
      return new Response(JSON.stringify({ ok: true }));
    }

    if (action === 'restore-trash') {
      const trash = await getTrash();
      const index = trash.findIndex(item => item.id === params.id);
      if (index === -1) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
      const [record] = trash.splice(index, 1);
      await setTrash(trash);
      await restoreRecord(record);
      return new Response(JSON.stringify({ ok: true }));
    }

    if (action === 'delete-trash') {
      const trash = await getTrash();
      const filtered = trash.filter(item => item.id !== params.id);
      await setTrash(filtered);
      return new Response(JSON.stringify({ ok: true }));
    }

    if (action === 'list-files') {
      const list = await env.MEDIA_BUCKET.list({ prefix: params.folder });
      return new Response(JSON.stringify({ files: list.objects, mediaBase: '/media' }));
    }

    if (action === 'delete-file') {
      await env.MEDIA_BUCKET.delete(params.key);
      return new Response(JSON.stringify({ ok: true }));
    }

    if (action === 'rename-file') {
      if (!params.oldKey || !params.newKey) {
        return new Response(JSON.stringify({ error: 'oldKey and newKey required' }), { status: 400 });
      }
      const existing = await env.MEDIA_BUCKET.get(params.oldKey);
      if (!existing) {
        return new Response(JSON.stringify({ error: 'Original file not found' }), { status: 404 });
      }
      if (params.oldKey !== params.newKey) {
        const conflict = await env.MEDIA_BUCKET.get(params.newKey);
        if (conflict) {
          return new Response(JSON.stringify({ error: 'Target file name already exists' }), { status: 409 });
        }
      }
      const buffer = await existing.arrayBuffer();
      const contentType = existing.httpMetadata?.contentType || 'application/octet-stream';
      await env.MEDIA_BUCKET.put(params.newKey, buffer, { httpMetadata: { contentType } });
      if (params.oldKey !== params.newKey) {
        await env.MEDIA_BUCKET.delete(params.oldKey);
      }
      return new Response(JSON.stringify({ ok: true }));
    }

    if (action === 'upload') {
      const buffer = Uint8Array.from(atob(params.fileData), c => c.charCodeAt(0));
      const prefix = params.fileName.startsWith('logo.') || params.fileName.startsWith('hero-bg.') ? '' : `${Date.now()}-`;
      const key = params.folder === 'assets' && prefix === '' ? `assets/${params.fileName}` : `${params.folder}/${prefix}${params.fileName}`;
      
      await env.MEDIA_BUCKET.put(key, buffer, { httpMetadata: { contentType: params.contentType } });
      if (params.folder === 'assets' && (key.startsWith('assets/logo.') || key.startsWith('assets/hero-bg.'))) {
        await deleteOtherFixedSameFamily(env.MEDIA_BUCKET, key);
      }
      const url = encodeURI(`/media/${key}`);
      return new Response(JSON.stringify({ ok: true, url }));
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
