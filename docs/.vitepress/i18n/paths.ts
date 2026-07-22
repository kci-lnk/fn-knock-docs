import {
  LOCALE_KEYS,
  LOCALES,
  localePath,
  type LocaleKey,
} from './catalog'

export type LocalizedEntry<T extends object> = T & {
  locale: LocaleKey
  lang: string
  url: string
}

const PREFIX_TO_LOCALE = LOCALE_KEYS.filter(
  (locale): locale is Exclude<LocaleKey, 'root'> => locale !== 'root',
)

/**
 * Adds a locale prefix to an internal route. The default zh-CN locale remains
 * at the root, while every other locale receives its configured directory.
 */
export function toLocalePath(path: string, locale: LocaleKey) {
  return localePath(locale, path)
}

/**
 * Resolves the locale and locale-neutral route from a VitePress URL.
 * Unknown prefixes intentionally fall back to root (zh-CN).
 */
export function fromLocalePath(path: string) {
  const normalized = path.startsWith('/') ? path : `/${path}`
  const locale = PREFIX_TO_LOCALE.find(
    (candidate) =>
      normalized === `/${candidate}` ||
      normalized.startsWith(`/${candidate}/`),
  )

  if (!locale) {
    return { locale: 'root' as const, path: normalized }
  }

  const withoutPrefix = normalized.slice(locale.length + 1)
  return {
    locale,
    path: withoutPrefix || '/',
  }
}

/**
 * Expands locale-neutral records for use in a .data.ts or .paths.ts module.
 * Callers keep their own data shape while receiving a stable locale and URL.
 */
export function expandLocalizedEntries<T extends object>(
  entries: readonly T[],
  getPath: (entry: T) => string,
) {
  return LOCALE_KEYS.flatMap((locale) =>
    entries.map(
      (entry): LocalizedEntry<T> => ({
        ...entry,
        locale,
        lang: LOCALES[locale].lang,
        url: toLocalePath(getPath(entry), locale),
      }),
    ),
  )
}
