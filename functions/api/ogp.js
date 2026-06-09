export async function onRequestGet(context) {
  const { request } = context;
  const url = new URL(request.url).searchParams.get('url');

  if (!url) {
    return new Response(JSON.stringify({ error: 'URL parameter is required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Cloudflare-Workers/1.0; +https://example.com)',
        'Accept': 'text/html'
      }
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch URL: ${res.status}`);
    }

    const html = await res.text();

    const getMetaContent = (nameOrProperty, html) => {
      // RegExp for <meta property="og:title" content="..."> or <meta name="description" content="...">
      const regex = new RegExp(`<meta\\s+(?:name|property)=["']${nameOrProperty}["']\\s+content=["'](.*?)["']\\s*\\/?>`, 'i');
      const match = html.match(regex);
      if (match) return match[1];

      // Reverse order: <meta content="..." property="og:title">
      const regexReverse = new RegExp(`<meta\\s+content=["'](.*?)["']\\s+(?:name|property)=["']${nameOrProperty}["']\\s*\\/?>`, 'i');
      const matchReverse = html.match(regexReverse);
      return matchReverse ? matchReverse[1] : null;
    };

    let title = getMetaContent('og:title', html) || getMetaContent('twitter:title', html);
    if (!title) {
      const titleMatch = html.match(/<title>(.*?)<\/title>/i);
      if (titleMatch) title = titleMatch[1];
    }

    const image = getMetaContent('og:image', html) || getMetaContent('twitter:image', html) || null;
    const description = getMetaContent('og:description', html) || getMetaContent('twitter:description', html) || getMetaContent('description', html) || null;

    // Convert relative URLs to absolute
    let finalImageUrl = image;
    if (image && !image.startsWith('http') && !image.startsWith('//')) {
      try {
        finalImageUrl = new URL(image, url).toString();
      } catch (e) {
        // ignore invalid urls
      }
    } else if (image && image.startsWith('//')) {
      finalImageUrl = 'https:' + image;
    }

    return new Response(JSON.stringify({
      url,
      title: title ? title.trim() : null,
      image: finalImageUrl,
      description: description ? description.trim() : null
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('OGP Fetch Error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
