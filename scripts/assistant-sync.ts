#!/usr/bin/env node
import 'dotenv/config'
import { performance } from 'node:perf_hooks'
import { ensureAssistantKnowledge } from '../lib/assistant/knowledge'

async function main() {
  const force = process.argv.includes('--force')
  const start = performance.now()

  const requiredEnv = ['SUPABASE_SERVICE_ROLE_KEY', 'NEXT_PUBLIC_SUPABASE_URL', 'OPENAI_API_KEY']
  const missing = requiredEnv.filter((key) => !process.env[key] || process.env[key]?.length === 0)
  if (missing.length) {
    console.error(`[assistant-sync] Missing env vars: ${missing.join(', ')}`)
    process.exit(1)
  }

  try {
    console.log(
      `[assistant-sync] Syncing knowledge base${force ? ' with force' : ''} using sources under ${process.cwd()}/docs`
    )
    await ensureAssistantKnowledge({ force })
    const durationMs = performance.now() - start
    console.log(`[assistant-sync] Completed in ${Math.round(durationMs)}ms`)
  } catch (error) {
    console.error('[assistant-sync] Failed to sync knowledge base')
    console.error(error)
    process.exit(1)
  }
}

main()
