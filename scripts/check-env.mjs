import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Get the directory of this script
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = join(__dirname, '..')

// Load environment variables from .env files
config({ path: join(projectRoot, '.env.local') })
config({ path: join(projectRoot, '.env') })

// Map Netlify Supabase Connector vars to NEXT_PUBLIC_* for build-time checks
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  process.env.NEXT_PUBLIC_SUPABASE_URL =
    process.env.SUPABASE_URL ||
    process.env.SUPABASE_DATABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL || ''
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY =
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
}

// Skip strict checks on Netlify previews and branch deploys; rely on runtime mapping
if (process.env.NETLIFY === 'true' && (process.env.CONTEXT === 'deploy-preview' || process.env.CONTEXT === 'branch-deploy')) {
  console.log(`Skipping strict env check for Netlify context: ${process.env.CONTEXT}`);
  process.exit(0);
}

const required = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`Missing env vars: ${missing.join(', ')}`);
  process.exit(1);
}
console.log('Environment looks good.');

