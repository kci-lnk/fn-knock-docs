import { defineConfig, type HeadConfig } from 'vitepress'
import {
  createThemeConfig,
  LOCALE_KEYS,
  LOCALES,
  localePath,
  type LocaleKey,
} from './i18n/catalog'

function logicalPagePath(relativePath: string) {
  const localizedPrefix = LOCALE_KEYS.find(
    (locale) =>
      locale !== 'root' && relativePath.startsWith(`${locale}/`),
  )
  const withoutLocale = localizedPrefix
    ? relativePath.slice(localizedPrefix.length + 1)
    : relativePath

  return withoutLocale
    .replace(/(^|\/)index\.md$/, '$1')
    .replace(/\.md$/, '')
}

function alternateLinks(relativePath: string): HeadConfig[] {
  const pagePath = logicalPagePath(relativePath)
  const links = LOCALE_KEYS.map((locale) => [
    'link',
    {
      rel: 'alternate',
      hreflang: LOCALES[locale].lang,
      href: localePath(locale, pagePath),
    },
  ]) satisfies HeadConfig[]

  links.push([
    'link',
    {
      rel: 'alternate',
      hreflang: 'x-default',
      href: localePath('root', pagePath),
    },
  ])

  return links
}

function siteLocale(locale: LocaleKey) {
  const { label, lang, link, title, description } = LOCALES[locale]
  return {
    label,
    lang,
    link,
    title,
    description,
    themeConfig: createThemeConfig(locale),
  }
}

export default defineConfig({
  lang: 'zh-CN',
  title: 'fn-knock',
  description:
    '为 NAS、家庭服务器和自托管服务提供统一入口、身份认证与访问控制',
  locales: {
    root: siteLocale('root'),
    'zh-tw': siteLocale('zh-tw'),
    en: siteLocale('en'),
    ja: siteLocale('ja'),
    ko: siteLocale('ko'),
  },
  head: [
    ['link', { rel: 'icon', type: 'image/png', href: '/logo.png' }],
    ['link', { rel: 'apple-touch-icon', href: '/logo.png' }],
    [
      'meta',
      {
        name: 'algolia-site-verification',
        content: 'F45DC98D25B20215',
      },
    ],
  ],
  cleanUrls: true,
  lastUpdated: true,
  transformHead({ pageData }) {
    return alternateLinks(pageData.relativePath)
  },
  markdown: {
    config(md) {
      md.renderer.rules.table_open = () =>
        '<div class="vp-table-wrap"><table>'
      md.renderer.rules.table_close = () => '</table></div>'
    },
  },
  themeConfig: {
    logo: '/logo.png',
    i18nRouting: true,
    socialLinks: [
      {
        icon: 'github',
        link: 'https://github.com/kci-lnk/fn-knock-turborepo',
      },
    ],
    search: {
      provider: 'algolia',
      options: {
        appId: 'Y5YEJM64ML',
        indexName: 'fnknock docs',
        apiKey: '0668f512dff8bc410295dd671e7c4b45',
        locales: {
          root: { placeholder: '搜索文档' },
          'zh-tw': { placeholder: '搜尋文件' },
          en: { placeholder: 'Search documentation' },
          ja: { placeholder: 'ドキュメントを検索' },
          ko: { placeholder: '문서 검색' },
        },
        askAi: {
          assistantId: 'ecb12a06-f6df-477d-bc95-e987256eab63',
          agentStudio: true,
          sidePanel: {
            agentStudio: true,
          },
        },
      },
    },
  },
})
