import * as contentApi from './api/content.js';
import * as adminApi from './api/admin-core.js';
import { tryServeMedia } from './lib/r2-media.js';

const UNPUBLISHED_REDIRECTS = {
  '/10th-anniv.html': 'anniv',
  '/sponsors.html': 'sponsors',
};

async function readJson(bucket, key) {
  const obj = await bucket.get(key);
  if (!obj) return null;
  try {
    return JSON.parse(await obj.text());
  } catch {
    return null;
  }
}

async function isRestrictedPagePublished(env, page) {
  if (page === 'anniv') {
    const data = await readJson(env.MEDIA_BUCKET, 'data/anniv-config.json');
    return !!(data && data.published);
  }
  if (page === 'sponsors') {
    const data = await readJson(env.MEDIA_BUCKET, 'data/sponsors.json');
    return !!(data && data.published);
  }
  return true;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    const media = await tryServeMedia(request, env);
    if (media) return media;

    if (pathname.startsWith('/api/admin-core')) {
      return adminApi.onRequestPost({ env, request, ctx });
    }

    if (pathname.startsWith('/api/content')) {
      return contentApi.onRequest({ env, request, ctx });
    }

    const restrictedPage = UNPUBLISHED_REDIRECTS[pathname];
    if (restrictedPage) {
      const published = await isRestrictedPagePublished(env, restrictedPage);
      if (!published) {
        return Response.redirect(new URL('/index.html', request.url), 302);
      }
    }

    return env.ASSETS.fetch(request);
  }
};
