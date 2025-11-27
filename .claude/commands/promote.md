# Promote to Production

Merge dev_claude into main for production deployment. ONLY do this when owner explicitly approves.

## Instructions

**STOP: Has the owner explicitly said to push to production/main?**

If yes:

```bash
# Ensure we're on dev_claude and up to date
git checkout dev_claude
git pull origin dev_claude

# Switch to main and merge
git checkout main
git pull origin main
git merge dev_claude

# Push to production
git push origin main

# Switch back to dev
git checkout dev_claude
```

After pushing, the site deploys to:
https://obsidianriterecords.com

DO NOT:
- Promote without explicit owner approval
- Create pull requests
- Use netlify deploy CLI
