// Skip in Netlify deploy previews to avoid failing PR builds
if (process.env.NETLIFY === 'true' && process.env.CONTEXT === 'deploy-preview') {
  console.log('Skipping env check for deploy-preview context.');
  process.exit(0);
}

const required = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`Missing env vars: ${missing.join(', ')}`);
  process.exit(1);
}
console.log('Environment looks good.');


