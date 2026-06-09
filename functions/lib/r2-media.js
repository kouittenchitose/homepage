/**
 * R2 に保存されたメディアをサイトのパス経由で配信する（Pages / Workers 共通）。
 * 正規パス: /media/<objectKey>
 * 旧データ互換: /assets/* /news/* /works/* （静的ファイルが無い場合のみ R2 を試す）
 */

const LEGACY_SEGMENTS = new Set(['assets', 'news', 'works']);

function legacyObjectKey(pathname) {
  if (!pathname.startsWith('/') || pathname.length < 2) return null;
  const rest = pathname.slice(1);
  const seg = rest.split('/')[0];
  if (!LEGACY_SEGMENTS.has(seg)) return null;
  return rest;
}

export async function tryServeMedia(request, env) {
  if (request.method !== 'GET') return null;
  const bucket = env.MEDIA_BUCKET;
  if (!bucket) return null;

  const url = new URL(request.url);
  const pathname = url.pathname;

  let key = null;
  if (pathname.startsWith('/media/')) {
    try {
      key = decodeURIComponent(pathname.slice('/media/'.length));
    } catch {
      return null;
    }
  } else {
    key = legacyObjectKey(pathname);
  }

  if (!key) return null;

  const obj = await bucket.get(key);
  if (!obj) return null;

  const contentType = obj.httpMetadata?.contentType || 'application/octet-stream';

  return new Response(obj.body, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=86400',
    },
  });
}

export async function r2ResponseOr404(bucket, key) {
  if (!bucket || !key) return new Response('Not Found', { status: 404 });
  const obj = await bucket.get(key);
  if (!obj) return new Response('Not Found', { status: 404 });
  const contentType = obj.httpMetadata?.contentType || 'application/octet-stream';
  return new Response(obj.body, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
