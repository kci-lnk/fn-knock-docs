import { readFile, readdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'

const workspace = process.cwd()
const docsRoot = path.join(workspace, 'docs')
const publicRoot = path.join(docsRoot, 'public')

const discouraged = [
  ['旧产品写法', /\bfknock\b/gi],
  ['旧产品写法', /Knock\s+敲门/g],
  ['模板化开场', /这页(?:解决|适合|讲)/g],
  ['模板化铺垫', /先(?:理解|记住|明确|说结论)/g],
  ['口语化强调', /到底/g],
  ['口语化强调', /真实含义/g],
  ['口语化强调', /最关键/g],
  ['模板化收尾', /标准完成状态/g],
  ['模板化收尾', /相关阅读/g],
  ['模板化铺垫', /一句话理解/g],
]

async function collectMarkdown(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue
    const target = path.join(directory, entry.name)
    if (entry.isDirectory()) files.push(...(await collectMarkdown(target)))
    if (entry.isFile() && entry.name.endsWith('.md')) files.push(target)
  }
  return files
}

function lineNumber(content, offset) {
  return content.slice(0, offset).split('\n').length
}

function isExternalTarget(target) {
  return target.startsWith('#') || target.startsWith('//') || /^[a-z][a-z\d+.-]*:/i.test(target)
}

function resolveInternalTarget(file, target) {
  const cleanTarget = decodeURIComponent(target.split(/[?#]/, 1)[0])
  if (!cleanTarget) return file
  if (cleanTarget === '/') return path.join(docsRoot, 'index.md')

  if (cleanTarget.startsWith('/')) {
    const publicFile = path.join(publicRoot, cleanTarget)
    if (existsSync(publicFile)) return publicFile
  }

  const sourceFile = cleanTarget.startsWith('/')
    ? path.join(docsRoot, cleanTarget)
    : path.resolve(path.dirname(file), cleanTarget)
  const candidates = [
    sourceFile,
    `${sourceFile}.md`,
    path.join(sourceFile, 'index.md'),
  ]
  return candidates.find(existsSync)
}

function inspectLinks(file, content, errors) {
  const linkPattern = /!?\[[^\]]*\]\((?:<([^>]+)>|([^\s)]+))(?:\s+['"][^'"]*['"])?\)/g
  for (const match of content.matchAll(linkPattern)) {
    const target = match[1] ?? match[2]
    if (isExternalTarget(target)) continue
    if (!resolveInternalTarget(file, target)) {
      errors.push(
        `${path.relative(workspace, file)}:${lineNumber(content, match.index)} — 站内链接不存在：${target}`,
      )
    }
  }
}

function inspectLanguage(file, content, errors) {
  // Historical URLs are part of the public contract and may retain an old slug.
  // Review prose, not Markdown link targets.
  const prose = content.replace(/\]\([^\n)]*\)/g, ']')
  for (const [label, pattern] of discouraged) {
    for (const match of prose.matchAll(pattern)) {
      errors.push(
        `${path.relative(workspace, file)}:${lineNumber(prose, match.index)} — ${label}：${match[0]}`,
      )
    }
  }
}

const files = await collectMarkdown(docsRoot)
const errors = []

for (const file of files) {
  const content = await readFile(file, 'utf8')
  inspectLinks(file, content, errors)
  inspectLanguage(file, content, errors)
}

if (errors.length > 0) {
  console.error(`文档检查失败（${errors.length} 项）：\n${errors.join('\n')}`)
  process.exitCode = 1
} else {
  console.log(`文档检查通过：${files.length} 篇 Markdown。`)
}
