import { createClient } from '@supabase/supabase-js'
import { config as dotenv } from 'dotenv'

dotenv({ path: '.env.local' })
dotenv({ path: '.env' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL_STAGING
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_1

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error('Missing Supabase env. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE)

const email = process.argv[2] || 'arg@obsidianriterecords.com'
const password = process.argv[3] || 'AdminPreview123!'

async function main() {
  try {
    // Try to create user; if exists, fallback to fetch via list
    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { from: 'admin-script' },
    })

    let userId = created?.user?.id
    if (createError) {
      // Look up existing user by listing (paginate small)
      const { data: listData, error: listError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 })
      if (listError) {
        console.error('List users failed:', listError)
        throw listError
      }
      const existing = listData.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())
      if (!existing) {
        console.error('Create user failed:', createError)
        throw createError
      }
      userId = existing.id
    }

    if (!userId) throw new Error('Failed to determine user id')

    // Upsert admin role
    const { error: roleError } = await supabase
      .from('user_roles')
      .upsert({ user_id: userId, role: 'admin' }, { onConflict: 'user_id' })

    if (roleError) throw roleError

    console.log('Admin user ready:')
    console.log(`  Email: ${email}`)
    console.log(`  Password: ${password}`)
  } catch (err) {
    console.error('Failed to create or configure admin user:', err?.message || err)
    process.exit(1)
  }
}

main()
