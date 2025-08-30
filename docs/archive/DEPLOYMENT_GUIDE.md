# Grimforge Site Deployment Guide

## 🚀 Current Status
- **Branch**: `feat/next15-migration` 
- **Deploy Preview**: https://deploy-preview-4--obsidianriterecords.netlify.app/
- **Admin Panel**: Fixed timeout issues ✅
- **Database**: Supabase configured with user roles ✅

## 🔧 Issues Resolved

### 1. Admin Panel Timeout Fix
**Problem**: Admin panel timed out when clicking profile icon
**Solution**: 
- Updated Supabase browser client configuration
- Changed `getIdentity()` to use `getUser()` instead of `getSession()`
- Added proper error handling for edge runtime compatibility
- Enhanced auth provider with timeout prevention

### 2. Admin User Setup
**Problem**: No admin user configured for arg@obsidianriterecords.com
**Solution**: Created automated setup script

## 📋 Immediate Actions Required

### Step 1: Setup Admin User in Supabase
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to your project > SQL Editor
3. Copy and run the contents of `scripts/setup_admin_user.sql`:

```sql
-- The script will:
-- 1. Check if arg@obsidianriterecords.com exists in auth.users
-- 2. Create user if needed (or have them sign up first)
-- 3. Grant admin role in user_roles table
-- 4. Verify the setup
```

### Step 2: Test Deploy Preview
1. Visit: https://deploy-preview-4--obsidianriterecords.netlify.app/admin
2. Login with arg@obsidianriterecords.com
3. Verify profile dropdown works without timeout
4. Test admin functionality

### Step 3: Merge to Main Branch
**When to merge**: After confirming admin panel works on deploy preview

```bash
git checkout main
git merge feat/next15-migration
git push origin main
```

## 🎨 Branding Updates

### Logo & Favicon
- Current favicon: `/public/favicon.ico` (7.6KB)
- Logo placeholder created: `/public/logo.svg`
- Site manifest configured: `/public/site.webmanifest`

### To Replace with Custom Logo:
1. Add your logo file to `/public/` (recommended: `logo.svg` or `logo.png`)
2. Update favicon by replacing `/public/favicon.ico`
3. For Google search results, ensure:
   - Logo is at least 112x112px
   - Use structured data (already configured)
   - Submit sitemap to Google Search Console

## 🔍 Environment Variables Check

Ensure these are set in Netlify:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_SITE_URL=https://obsidianriterecords.netlify.app
```

## 🛠️ Technical Details

### Auth Provider Changes
- **Before**: Used `getSession()` which caused timeouts in edge runtime
- **After**: Uses `getUser()` with proper error handling
- **Benefit**: Faster, more reliable authentication checks

### Database Schema
- `user_roles` table with enum type `app_role` ('admin', 'moderator', 'user')
- RLS policies restrict admin functions to users with admin role
- Helper function `has_role()` for permission checks

### Next.js 15 Compatibility
- Updated Supabase client configuration for edge runtime
- Proper SSR handling with `@supabase/ssr`
- Enhanced error boundaries and timeout handling

## 🚨 Troubleshooting

### Admin Panel Still Times Out
1. Check browser console for errors
2. Verify Supabase environment variables in Netlify
3. Ensure user has admin role in database
4. Check Supabase logs for authentication errors

### Login Issues
1. Verify user exists in `auth.users` table
2. Check `user_roles` table for admin role
3. Run the admin setup script again
4. Clear browser cache and cookies

### Deployment Issues
1. Check Netlify build logs
2. Verify all environment variables are set
3. Ensure no TypeScript errors in build
4. Check for missing dependencies

## 📞 Support
- Repository: https://github.com/TGreen87/grimforge-site
- Branch: `feat/next15-migration`
- Contact: Technical issues should be logged as GitHub issues

---

**Last Updated**: $(date)
**Status**: Ready for production deployment
