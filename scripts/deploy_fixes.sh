#!/bin/bash

# Deploy Fixes Script for Grimforge Site
# This script applies all the fixes and prepares for deployment

set -e

echo "🔧 Applying deployment fixes for Grimforge Site..."

# 1. Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in the project root directory"
    exit 1
fi

# 2. Ensure we're on the correct branch
echo "📋 Checking current branch..."
CURRENT_BRANCH=$(git branch --show-current)
echo "Current branch: $CURRENT_BRANCH"

if [ "$CURRENT_BRANCH" != "feat/next15-migration" ]; then
    echo "⚠️  Warning: Not on feat/next15-migration branch"
    echo "Switching to feat/next15-migration..."
    git checkout feat/next15-migration
fi

# 3. Add and commit the auth provider fixes
echo "💾 Committing auth provider fixes..."
git add -A
git commit -m "fix: resolve admin panel timeout issues

- Update Supabase browser client with proper configuration
- Fix getIdentity method to use getUser() instead of getSession()
- Add proper error handling and timeout prevention
- Create admin user setup script for arg@obsidianriterecords.com
- Improve edge runtime compatibility for Next.js 15" || echo "No changes to commit"

# 4. Push changes
echo "🚀 Pushing changes to remote..."
git push origin feat/next15-migration

# 5. Create favicon and logo setup
echo "🎨 Setting up favicon and logo configuration..."
cat > public/site.webmanifest << 'EOF'
{
    "name": "Obsidian Rite Records",
    "short_name": "Obsidian Rite",
    "description": "Underground Black Metal Record Label",
    "icons": [
        {
            "src": "/favicon.ico",
            "sizes": "any",
            "type": "image/x-icon"
        }
    ],
    "theme_color": "#000000",
    "background_color": "#000000",
    "display": "standalone",
    "start_url": "/"
}
EOF

# 6. Create a simple logo placeholder if none exists
if [ ! -f "public/logo.svg" ]; then
    echo "📝 Creating logo placeholder..."
    cat > public/logo.svg << 'EOF'
<svg width="200" height="60" viewBox="0 0 200 60" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="200" height="60" fill="#000000"/>
  <text x="100" y="35" font-family="Arial, sans-serif" font-size="14" font-weight="bold" text-anchor="middle" fill="#FFFFFF">
    OBSIDIAN RITE RECORDS
  </text>
</svg>
EOF
fi

# 7. Update the layout to include proper favicon links
echo "🔗 Updating favicon configuration..."
mkdir -p app/favicon
cat > app/favicon/route.ts << 'EOF'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  // Return the favicon.ico file
  const response = await fetch(new URL('/favicon.ico', request.url))
  return response
}
EOF

echo "✅ All fixes applied successfully!"
echo ""
echo "📋 Next Steps:"
echo "1. The admin panel timeout fix has been applied"
echo "2. Run the admin user setup script in Supabase SQL Editor:"
echo "   - Copy contents of scripts/setup_admin_user.sql"
echo "   - Run in Supabase Dashboard > SQL Editor"
echo ""
echo "3. To merge feat/next15-migration to main:"
echo "   git checkout main"
echo "   git merge feat/next15-migration"
echo "   git push origin main"
echo ""
echo "4. Netlify will automatically deploy the main branch"
echo "5. After deployment, test the admin panel at:"
echo "   https://obsidianriterecords.netlify.app/admin"
echo ""
echo "🔍 Troubleshooting:"
echo "- If admin panel still times out, check Supabase environment variables in Netlify"
echo "- Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set"
echo "- Run the admin user setup script if login fails"
