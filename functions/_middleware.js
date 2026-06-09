import { tryServeMedia } from './lib/r2-media.js';

/**
 * Pages では functions/index.js がルート `/` 用に解決されるだけなので、
 * 旧 URL（/assets/* 等）はここで R2 を試し、無ければ静的へ fallthrough。
 */
export async function onRequest(context) {
  const media = await tryServeMedia(context.request, context.env);
  if (media) return media;
  return context.next();
}
