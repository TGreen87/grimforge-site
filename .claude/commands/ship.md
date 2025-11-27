# Ship to Dev Branch

Commit current changes and push to dev_claude branch for Netlify auto-deploy.

## Instructions

1. Check git status for changed files
2. Run lint check
3. Commit with a descriptive message
4. Push to dev_claude
5. Report the Netlify deploy URL

```bash
# Check what's changed
git status

# Run lint
npm run lint

# Stage, commit, push
git add -A
git commit -m "YOUR_MESSAGE_HERE

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

git push origin dev_claude
```

After pushing, remind user to check:
https://dev-claude--obsidianriterecords.netlify.app

DO NOT:
- Use `netlify deploy` CLI
- Push to main without owner approval
- Create pull requests (owner doesn't use them)
