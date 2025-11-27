# Check Environment Variables

Verify environment variables are set correctly in Netlify.

## Instructions

```bash
# List Netlify env vars (redacted values)
npx netlify env:list
```

Required variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `OPENAI_API_KEY`
- `ELEVENLABS_API_KEY`
- `GOOGLE_AI_API_KEY`
- `ANTHROPIC_API_KEY`

Report back with:
- Which required vars are set
- Which are missing
- Any vars that might need updating
