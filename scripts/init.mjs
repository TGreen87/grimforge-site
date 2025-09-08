#!/usr/bin/env node
import { execSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { config as dotenv } from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const root = join(__dirname, '..')

// Load local env for checks (does not override existing)
dotenv({ path: join(root, '.env.local') })
dotenv({ path: join(root, '.env') })

function sh(cmd) {
  return execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
}

function has(varName) {
  const v = process.env[varName]
  return v && String(v).length > 0
}

function status(ok, label, value = '') {
  const icon = ok ? '✓' : '✗'
  const line = value ? `${label}: ${value}` : label
  console.log(`${icon} ${line}`)
}

function section(title) {
  console.log(`\n=== ${title} ===`)
}

// 1) Repo state
section('Repo')
let branch = 'unknown'
try { branch = sh('git rev-parse --abbrev-ref HEAD') } catch {}
status(true, 'Branch', branch)
const workingBranch = 'feat/admin-suite-phase1'
status(branch === workingBranch, `Working on ${workingBranch}`)
try {
  const remote = sh('git remote get-url origin')
  status(true, 'Remote', remote)
} catch {
  status(false, 'Remote origin missing')
}

// 2) Env config
section('Env')
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ''
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || ''
const supabaseService = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE || ''
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.URL || ''

status(!!supabaseUrl, 'SUPABASE_URL', supabaseUrl ? '(set)' : '')
status(!!supabaseAnon, 'SUPABASE_ANON_KEY', supabaseAnon ? '(set)' : '')
status(!!supabaseService, 'SUPABASE_SERVICE_ROLE_KEY', supabaseService ? '(set)' : '')
status(!!siteUrl, 'NEXT_PUBLIC_SITE_URL', siteUrl || '')

// 3) Netlify context
section('Netlify')
const isNetlify = process.env.NETLIFY === 'true'
const context = process.env.CONTEXT || ''
status(isNetlify, 'NETLIFY runtime', context)

// 4) Guidance
section('Guidance')
console.log('- Single working branch, no PRs')
console.log('- Push only to feat/admin-suite-phase1 (main is protected)')
console.log('- Enable Netlify Branch Deploy for feat/admin-suite-phase1')
console.log('- For production, push to main ONLY when explicitly approved')

// 5) AGENTS.md availability
const agentsPath = join(root, 'docs', 'AGENTS.md')
status(existsSync(agentsPath), 'AGENTS.md present', agentsPath)

// 6) Optional quick checks
try {
  section('Quick Checks')
  sh('node -v') && status(true, 'Node available')
  sh('npm -v') && status(true, 'npm available')
} catch {}

console.log('\nInit complete. If any checks show ✗, address them before continuing.')

