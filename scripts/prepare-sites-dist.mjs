import { cp, mkdir, rm } from 'node:fs/promises'
import path from 'node:path'

const workspace = process.cwd()
const vitePressOutput = path.join(
  workspace,
  'docs',
  '.vitepress',
  'dist',
)
const sitesOutput = path.join(workspace, 'dist')

await rm(sitesOutput, { recursive: true, force: true })
await mkdir(path.join(sitesOutput, 'client'), { recursive: true })
await mkdir(path.join(sitesOutput, 'server'), { recursive: true })
await cp(vitePressOutput, path.join(sitesOutput, 'client'), {
  recursive: true,
})
await cp(
  path.join(workspace, 'sites', 'worker.js'),
  path.join(sitesOutput, 'server', 'index.js'),
)

console.log('Sites deployment bundle prepared in dist/.')
