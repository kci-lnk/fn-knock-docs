import type { EnhanceAppContext } from 'vitepress'

type PreferredLocale = 'root' | 'zh-tw' | 'en' | 'ja' | 'ko'

const STORAGE_KEY = 'fn-knock-docs-locale'
const SUPPORTED_LOCALES = new Set<PreferredLocale>([
  'root',
  'zh-tw',
  'en',
  'ja',
  'ko',
])

function stripBase(pathname: string, base: string) {
  if (base === '/') return pathname
  const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base
  const stripped = pathname.startsWith(normalizedBase)
    ? pathname.slice(normalizedBase.length)
    : pathname
  return stripped || '/'
}

function localeFromPath(pathname: string, base: string): PreferredLocale {
  const path = stripBase(pathname, base)
  if (path === '/zh-tw' || path.startsWith('/zh-tw/')) return 'zh-tw'
  if (path === '/en' || path.startsWith('/en/')) return 'en'
  if (path === '/ja' || path.startsWith('/ja/')) return 'ja'
  if (path === '/ko' || path.startsWith('/ko/')) return 'ko'
  return 'root'
}

function localeFromLanguageTag(language: string): PreferredLocale | undefined {
  const tag = language.toLowerCase().replaceAll('_', '-')

  if (
    tag === 'zh-tw' ||
    tag === 'zh-hk' ||
    tag === 'zh-mo' ||
    tag.startsWith('zh-hant')
  ) {
    return 'zh-tw'
  }
  if (tag === 'zh' || tag.startsWith('zh-')) return 'root'
  if (tag === 'en' || tag.startsWith('en-')) return 'en'
  if (tag === 'ja' || tag.startsWith('ja-')) return 'ja'
  if (tag === 'ko' || tag.startsWith('ko-')) return 'ko'
}

export function matchBrowserLocale(
  languages: readonly string[],
): PreferredLocale {
  for (const language of languages) {
    const locale = localeFromLanguageTag(language)
    if (locale) return locale
  }

  return 'root'
}

function detectBrowserLocale(): PreferredLocale {
  const languages =
    navigator.languages.length > 0
      ? navigator.languages
      : [navigator.language]
  return matchBrowserLocale(languages)
}

function readPreference(): PreferredLocale | undefined {
  try {
    const preference = localStorage.getItem(STORAGE_KEY) as PreferredLocale
    return SUPPORTED_LOCALES.has(preference) ? preference : undefined
  } catch {
    return undefined
  }
}

function writePreference(locale: PreferredLocale) {
  try {
    localStorage.setItem(STORAGE_KEY, locale)
  } catch {
    // Private browsing and hardened browsers can reject localStorage writes.
  }
}

function localeHome(locale: PreferredLocale, base: string) {
  if (locale === 'root') return base
  return `${base}${locale}/`
}

/**
 * Redirects the root document before VitePress hydrates it. Using router.go()
 * during the initial route hook leaves the server-rendered zh-CN document in
 * place while the reactive locale has already changed, producing mixed-language
 * pages until the next full reload.
 */
function redirectRootToPreferredLocale(base: string) {
  const sitePath = stripBase(window.location.pathname, base)
  if (sitePath !== '/' && sitePath !== '/index.html') return false

  const preferredLocale = readPreference() ?? detectBrowserLocale()
  if (preferredLocale === 'root') return false

  const destination = new URL(
    localeHome(preferredLocale, base),
    window.location.origin,
  )
  destination.search = window.location.search
  destination.hash = window.location.hash
  window.location.replace(destination)
  return true
}

/**
 * Restores the preferred locale on root-page loads and persists subsequent
 * manual locale choices. Deep links remain stable.
 */
export function installLocalePreference({
  router,
  siteData,
}: EnhanceAppContext) {
  if (typeof window === 'undefined') return

  const base = siteData.value.base
  if (redirectRootToPreferredLocale(base)) return

  const previousAfterRouteChange = router.onAfterRouteChange

  router.onAfterRouteChange = async (to) => {
    await previousAfterRouteChange?.(to)

    const url = new URL(to, window.location.origin)
    writePreference(localeFromPath(url.pathname, base))
  }
}
