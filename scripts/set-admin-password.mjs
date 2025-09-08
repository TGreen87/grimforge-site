import { createClient } from '@supabase/supabase-js'
import { config as dotenv } from 'dotenv'

dotenv({ path: '.env.local' })
dotenv({ path: '.env' })

// Resolve Supabase URL and service role from common env keys
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || process.env.SUPABASE_DATABASE_URL || process.env.SUPABASE_URL_STAGING
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_SERVICE_ROLE_1

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error('Missing Supabase env. Ensure NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY are set.')
  process.exit(1)
}

// Optional CLI overrides for URL and service key
const overrideUrl = process.argv[4]
const overrideService = process.argv[5]
const effectiveUrl = overrideUrl || SUPABASE_URL
const effectiveService = overrideService || SERVICE_ROLE

const supabase = createClient(effectiveUrl, effectiveService)

const email = (process.argv[2] || 'arg@obsidianriterecords.com').toLowerCase()
const password = process.argv[3] || 'AdminPreview123!'

async function findUserByEmail(targetEmail) {
  let page = 1
  const perPage = 200
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage })
    if (error) throw error
    const found = data.users.find((u) => (u.email || '').toLowerCase() === targetEmail)
    if (found) return found
    if (data.users.length < perPage) return null
    page += 1
  }
}

async function ensureUserRole(userId) {
  const { error } = await supabase
    .from('user_roles')
    .upsert({ user_id: userId, role: 'admin' }, { onConflict: 'user_id' })
  if (error) throw error
}

async function main() {
  try {
    let user = await findUserByEmail(email)
    if (!user) {
      console.log('User not found. Creating...')
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { created_by: 'set-admin-password.mjs' },
      })
      if (error) throw error
      user = data.user
      console.log('Created user', user?.id)
    } else {
      console.log('User found:', user.id)
      const { error: upErr } = await supabase.auth.admin.updateUserById(user.id, {
        password,
        email_confirm: true,
      })
      if (upErr) throw upErr
      console.log('Password updated and email confirmed')
    }

    await ensureUserRole(user.id)
    console.log('Admin role ensured')
    console.log('Done.')
    console.log(`Login with ${email} / ${password}`)
  } catch (err) {
    console.error('Error:', err?.message || err)
    process.exit(1)
  }
}

main()
