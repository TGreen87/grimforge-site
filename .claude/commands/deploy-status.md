# Check Netlify Deploy Status

Check the status of the latest Netlify deploys for both dev and production branches.

## Instructions

1. Use curl to check the Netlify API for recent deploys
2. Show the status of `dev_claude` branch deploy
3. Show the status of `main` (production) deploy
4. Report any failed builds with error context

```bash
# Get recent deploys
npx netlify status

# Check if site is responding
curl -s -o /dev/null -w "%{http_code}" https://dev-claude--obsidianriterecords.netlify.app/api/admin/voice/voices
```

Report back with:
- Deploy status (building/ready/failed)
- Last deploy time
- Any errors if failed
