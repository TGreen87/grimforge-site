#!/usr/bin/env node
/**
 * Backfill orders/customer data into the new schema.
 *
 * Usage: node scripts/backfill-orders.mjs <csv-file>
 *
 * Expected CSV columns: order_number,email,status,payment_status,total,created_at
 * This script is a scaffold; replace TODOs with actual data mapping once
 * you have exports from the legacy system or Stripe.
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'
import csvParse from 'csv-parse/lib/sync.js'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or service role key. Populate env vars before running.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function main() {
  const filePath = process.argv[2]
  if (!filePath) {
    console.error('Usage: node scripts/backfill-orders.mjs <csv-file>')
    process.exit(1)
  }

  const csvData = await fs.readFile(path.resolve(filePath), 'utf8')
  const rows = csvParse(csvData, { columns: true, skip_empty_lines: true })

  for (const row of rows) {
    // TODO: map legacy customer + order_id here
    const email = row.email?.toLowerCase?.() || null
    if (!email) {
      console.warn('Skipping row without email', row)
      continue
    }

    const { data: customer } = await supabase
      .from('customers')
      .upsert({ email }, { onConflict: 'email' })
      .select('id')
      .single()

    if (!customer?.id) {
      console.warn('Failed to upsert customer', email)
      continue
    }

    await supabase.from('orders').upsert({
      order_number: row.order_number,
      email,
      customer_id: customer.id,
      status: row.status || 'fulfilled',
      payment_status: row.payment_status || 'paid',
      total: Number(row.total ?? 0),
      currency: row.currency || 'AUD',
      created_at: row.created_at || new Date().toISOString(),
    })
  }

  console.log(`Processed ${rows.length} rows.`)
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
