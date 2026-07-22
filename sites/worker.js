/**
 * Cloudflare Workers adapter for the static VitePress output used by Sites.
 * The ASSETS binding serves dist/client; clean URL fallbacks mirror
 * VitePress's cleanUrls behavior.
 */
const worker = {
  async fetch(request, env) {
    const directResponse = await env.ASSETS.fetch(request)
    if (directResponse.status !== 404 || request.method !== 'GET') {
      return directResponse
    }

    const url = new URL(request.url)
    const pathname = decodeURIComponent(url.pathname)
    const lastSegment = pathname.split('/').at(-1) ?? ''
    const candidates = []

    if (!lastSegment.includes('.')) {
      if (pathname.endsWith('/')) {
        candidates.push(`${pathname}index.html`)
      } else {
        candidates.push(`${pathname}.html`, `${pathname}/index.html`)
      }
    }

    for (const candidate of candidates) {
      const assetUrl = new URL(request.url)
      assetUrl.pathname = candidate
      const response = await env.ASSETS.fetch(
        new Request(assetUrl, request),
      )
      if (response.status !== 404) return response
    }

    const notFoundUrl = new URL(request.url)
    notFoundUrl.pathname = '/404.html'
    const notFound = await env.ASSETS.fetch(new Request(notFoundUrl, request))
    return new Response(notFound.body, {
      status: 404,
      headers: notFound.headers,
    })
  },
}

export default worker
