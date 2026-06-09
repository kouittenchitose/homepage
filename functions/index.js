import * as contentApi from './api/content.js';
import * as adminApi from './api/admin-core.js';
import { tryServeMedia } from './lib/r2-media.js';

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

    return env.ASSETS.fetch(request);
  }
};
