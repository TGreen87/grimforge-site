# Check Supabase Status

Check Supabase database and migration status.

## Instructions

```bash
# Check Supabase CLI status
npx supabase status

# List recent migrations
ls -la /mnt/a/dev/grimforge-site/supabase/migrations | tail -10

# Check if we can connect (via the app's status endpoint)
curl -s "https://dev-claude--obsidianriterecords.netlify.app/status"
```

Report back with:
- Supabase project status
- Number of migrations
- Most recent migration name/date
- Any connection issues
