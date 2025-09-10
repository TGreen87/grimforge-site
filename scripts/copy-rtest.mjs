#!/usr/bin/env node
/**
 * Simple runtime copy tester.
 * Usage: RTEST_URL=https://example.com node scripts/copy-rtest.mjs
 */
import https from 'https'
import http from 'http'

const url = process.env.RTEST_URL
if (!url) {
  console.error('RTEST_URL is required')
  process.exit(2)
}

const get = (u) => new Promise((resolve, reject) => {
  const mod = u.startsWith('https') ? https : http
  mod
    .get(u, (res) => {
      let data = ''
      res.on('data', (c) => (data += c))
      res.on('end', () => resolve({ status: res.statusCode, body: data }))
    })
    .on('error', reject)
})

const asserts = [
  { old: 'Cassettes Tapes', want: 'Cassette tapes' },
  { old: 'All (0)Vinyl (0)Cassettes Tapes (0)CDs (0)', want: 'All (0) • Vinyl (0) • Cassette tapes (0) • CDs (0)' },
]

;(async () => {
  try {
    const { status, body } = await get(url)
    if (status !== 200) {
      console.error(`Non-200 status: ${status}`)
      process.exit(1)
    }

    let ok = true
    for (const a of asserts) {
      const hasOld = body.includes(a.old)
      const hasWant = body.includes(a.want)
      if (hasOld || !hasWant) {
        ok = false
        console.log(`FAIL: old='${a.old}' present=${hasOld} want='${a.want}' present=${hasWant}`)
        // Print nearby context for debugging
        const idx = body.indexOf(hasOld ? a.old : a.want)
        const start = Math.max(0, idx - 120)
        const end = Math.min(body.length, idx + 120)
        console.log('Context:', body.slice(start, end).replace(/\n/g, ' '))
      }
    }

    if (!ok) process.exit(1)
    console.log('OK')
  } catch (e) {
    console.error('Error:', e)
    process.exit(1)
  }
})()

