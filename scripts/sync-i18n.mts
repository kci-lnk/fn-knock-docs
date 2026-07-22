import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import path from 'node:path'
import {
  LOCALES,
  PAGE_TITLES,
  type LocaleKey,
  type PagePath,
} from '../docs/.vitepress/i18n/catalog.ts'
import { matchBrowserLocale } from '../docs/.vitepress/theme/locale-preference.ts'

const workspace = process.cwd()
const docsRoot = path.join(workspace, 'docs')
const localizedLocales = ['zh-tw', 'en', 'ja', 'ko'] as const
const checkOnly = process.argv.includes('--check')

async function collectMarkdown(
  directory: string,
  ignoredDirectories = new Set<string>(),
): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true })
  const files: string[] = []

  for (const entry of entries) {
    if (entry.name.startsWith('.') || ignoredDirectories.has(entry.name)) {
      continue
    }

    const target = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await collectMarkdown(target)))
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(target)
    }
  }

  return files
}

function toPosix(relativePath: string) {
  return relativePath.split(path.sep).join('/')
}

function pagePath(relativePath: string) {
  return relativePath.replace(/\.md$/, '') as PagePath
}

function yamlString(value: string) {
  return JSON.stringify(value)
}

function sha256(content: string) {
  return createHash('sha256').update(content).digest('hex')
}

function prefixInternalLinks(content: string, locale: LocaleKey) {
  const routeStart =
    '(?=(?:quick-start|tutorials|guide|origin)(?:/|[?#)])|faq(?:[?#)]|$))'

  return content
    .replace(
      new RegExp(`(\\]\\()/${routeStart}`, 'g'),
      `$1/${locale}/`,
    )
    .replace(
      new RegExp(`(href=["'])/${routeStart}`, 'g'),
      `$1/${locale}/`,
    )
}

function localizePage(
  source: string,
  relativePath: string,
  locale: (typeof localizedLocales)[number],
) {
  const page = pagePath(relativePath)
  const title = PAGE_TITLES[page]?.[locale]
  if (!title) {
    throw new Error(`缺少 ${locale} 页面标题：${relativePath}`)
  }

  const localizedBody = prefixInternalLinks(source, locale).replace(
    /^# .+$/m,
    `# ${title}`,
  )

  return `---
lang: ${LOCALES[locale].lang}
title: ${yamlString(title)}
sourceLocale: zh-CN
translationStatus: source-synced
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

${localizedBody}`
}

function findFirstHeading(content: string) {
  return content.match(/^# (.+)$/m)?.[1]
}

function inspectLocaleLinks(
  content: string,
  locale: (typeof localizedLocales)[number],
  relativePath: string,
) {
  const errors: string[] = []
  const linkPattern = /(?:\]\(|href=["'])(\/[^)\s"'#?]+)(?:[#?][^)\s"']*)?/g

  for (const match of content.matchAll(linkPattern)) {
    const target = match[1]
    const isDocRoute =
      /^\/(?:quick-start|tutorials|guide|origin)(?:\/|$)/.test(target) ||
      target === '/faq'
    if (isDocRoute) {
      errors.push(
        `${locale}/${relativePath} — 站内链接缺少 /${locale}/ 前缀：${target}`,
      )
    }
  }

  return errors
}

const sourceFiles = await collectMarkdown(
  docsRoot,
  new Set(localizedLocales),
)
const sourceRelativePaths = sourceFiles
  .map((file) => toPosix(path.relative(docsRoot, file)))
  .sort()
const sourceArticlePaths = sourceRelativePaths.filter(
  (relativePath) => relativePath !== 'index.md',
)
const errors: string[] = []
let created = 0
let updated = 0

const browserLocaleCases = [
  { languages: ['zh-CN'], expected: 'root' },
  { languages: ['zh-Hant-TW'], expected: 'zh-tw' },
  { languages: ['zh-HK'], expected: 'zh-tw' },
  { languages: ['en-GB'], expected: 'en' },
  { languages: ['ja-JP'], expected: 'ja' },
  { languages: ['ko-KR'], expected: 'ko' },
  { languages: ['fr-FR', 'en-US'], expected: 'en' },
  { languages: ['fr-FR'], expected: 'root' },
] as const

for (const { languages, expected } of browserLocaleCases) {
  const actual = matchBrowserLocale(languages)
  if (actual !== expected) {
    errors.push(
      `浏览器语言匹配错误：${languages.join(', ')} 应为 ${expected}，当前为 ${actual}`,
    )
  }
}

for (const relativePath of sourceArticlePaths) {
  const page = pagePath(relativePath)
  if (!PAGE_TITLES[page]) {
    errors.push(`标题目录缺少简体中文源页面：${relativePath}`)
  }
}

for (const page of Object.keys(PAGE_TITLES)) {
  if (!sourceArticlePaths.includes(`${page}.md`)) {
    errors.push(`标题目录指向不存在的源页面：${page}.md`)
  }
}

for (const locale of localizedLocales) {
  const localeRoot = path.join(docsRoot, locale)
  const localeFiles = await collectMarkdown(localeRoot)
  const localeRelativePaths = localeFiles
    .map((file) => toPosix(path.relative(localeRoot, file)))
    .sort()

  for (const relativePath of sourceRelativePaths) {
    const target = path.join(localeRoot, relativePath)
    const exists = localeRelativePaths.includes(relativePath)

    if (!exists && !checkOnly && relativePath !== 'index.md') {
      const source = await readFile(path.join(docsRoot, relativePath), 'utf8')
      await mkdir(path.dirname(target), { recursive: true })
      await writeFile(target, localizePage(source, relativePath, locale))
      created += 1
      continue
    }

    if (!exists) {
      errors.push(`${locale} 缺少对应页面：${relativePath}`)
      continue
    }

    if (relativePath === 'index.md') continue

    let localized = await readFile(target, 'utf8')
    const source = await readFile(path.join(docsRoot, relativePath), 'utf8')
    const translationStatus = localized.match(
      /^translationStatus:\s*([^\s]+)\s*$/m,
    )?.[1]

    if (translationStatus === 'source-synced') {
      const expectedContent = localizePage(source, relativePath, locale)

      if (localized !== expectedContent) {
        if (checkOnly) {
          errors.push(
            `${locale}/${relativePath} — source-synced 页面与简体中文源内容不同步`,
          )
        } else {
          await writeFile(target, expectedContent)
          localized = expectedContent
          updated += 1
        }
      }

      if (checkOnly) {
        errors.push(
          `${locale}/${relativePath} — 正文尚未翻译（translationStatus: source-synced）`,
        )
      }
    } else if (translationStatus === 'translated') {
      const expectedSourceHash = sha256(source)
      const actualSourceHash = localized.match(
        /^translationSourceHash:\s*([0-9a-f]{64})\s*$/m,
      )?.[1]

      if (actualSourceHash !== expectedSourceHash) {
        errors.push(
          `${locale}/${relativePath} — translationSourceHash 应为 ${expectedSourceHash}，当前为 ${actualSourceHash ?? '缺失或格式错误'}`,
        )
      }
    } else {
      errors.push(
        `${locale}/${relativePath} — translationStatus 应为 source-synced 或 translated，当前为 ${translationStatus ?? '缺失'}`,
      )
    }

    const expectedTitle = PAGE_TITLES[pagePath(relativePath)]?.[locale]
    const actualTitle = findFirstHeading(localized)
    if (expectedTitle !== actualTitle) {
      errors.push(
        `${locale}/${relativePath} — 页面标题应为“${expectedTitle}”，当前为“${actualTitle ?? '未设置'}”`,
      )
    }
    errors.push(...inspectLocaleLinks(localized, locale, relativePath))
  }

  for (const relativePath of localeRelativePaths) {
    if (!sourceRelativePaths.includes(relativePath)) {
      errors.push(`${locale} 存在无简体中文对应页面：${relativePath}`)
    }
  }
}

if (errors.length > 0) {
  console.error(`i18n 检查失败（${errors.length} 项）：\n${errors.join('\n')}`)
  process.exitCode = 1
} else if (checkOnly) {
  console.log(
    `i18n 检查通过：${sourceRelativePaths.length} 条路径 × 5 种语言。`,
  )
} else {
  console.log(
    `i18n 同步完成：新增 ${created} 篇、更新 ${updated} 篇，共 ${sourceRelativePaths.length} 条对应路径。`,
  )
}
