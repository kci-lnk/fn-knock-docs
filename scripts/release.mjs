import { spawnSync } from 'node:child_process'

const input = process.argv[2]

if (!input) {
  console.error('Usage: npm run release -- v1.2.3')
  process.exit(1)
}

const tag = input.startsWith('v') ? input : `v${input}`

if (!/^v\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(tag)) {
  console.error(`Invalid release tag: ${tag}`)
  console.error('Expected a semantic version such as v1.2.3 or v1.2.3-beta.1')
  process.exit(1)
}

function git(args, { capture = false, allowFailure = false } = {}) {
  const result = spawnSync('git', args, {
    encoding: 'utf8',
    stdio: capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
  })

  if (result.error) throw result.error
  if (!allowFailure && result.status !== 0) process.exit(result.status ?? 1)
  return result
}

const status = git(['status', '--porcelain'], { capture: true }).stdout.trim()
if (status) {
  console.error('Working tree is not clean. Commit or stash changes before releasing.')
  process.exit(1)
}

const branch = git(['branch', '--show-current'], { capture: true }).stdout.trim()
if (branch !== 'main') {
  console.error(`Releases must be created from main (current branch: ${branch || 'detached HEAD'}).`)
  process.exit(1)
}

git(['fetch', 'origin', 'main', '--tags'])

const localCommit = git(['rev-parse', 'HEAD'], { capture: true }).stdout.trim()
const remoteCommit = git(['rev-parse', 'origin/main'], { capture: true }).stdout.trim()
if (localCommit !== remoteCommit) {
  console.error('Local main is not synchronized with origin/main. Push or pull before releasing.')
  process.exit(1)
}

const existingTag = git(['show-ref', '--verify', '--quiet', `refs/tags/${tag}`], {
  allowFailure: true,
})
if (existingTag.status === 0) {
  console.error(`Tag already exists: ${tag}`)
  process.exit(1)
}

git(['tag', '--annotate', tag, '--message', `Release ${tag}`])
git(['push', 'origin', `refs/tags/${tag}`])

console.log(`Published ${tag}.`)
