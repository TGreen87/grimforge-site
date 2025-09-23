# Database Scripts

This directory contains SQL scripts for managing your Grimforge admin system.

## Scripts Overview

### 1. `grant_admin.sql`
**Purpose**: Grant admin access to arg@obsidianriterecords.com
**When to use**: After setting up the database and before first admin login
**How to run**: Copy and paste into Supabase SQL Editor

```sql
-- This script will:
-- ✓ Check if user exists in auth.users
-- ✓ Grant admin role if user exists
-- ✓ Show verification of admin users
```

### 2. `health_check.sql`
**Purpose**: Comprehensive database health check
**When to use**: Regular monitoring, troubleshooting issues
**How to run**: Copy and paste into Supabase SQL Editor

```sql
-- This script checks:
-- ✓ Table counts and data presence
-- ✓ Admin user assignments
-- ✓ Row Level Security status
-- ✓ Critical functions existence
-- ✓ Inventory alerts
-- ✓ Recent orders status
-- ✓ Webhook events
-- ✓ Data integrity
```

### 3. `setup_sample_data.sql`
**Purpose**: Create sample products, variants, and test data
**When to use**: Initial setup, testing, development
**How to run**: Copy and paste into Supabase SQL Editor

```sql
-- This script creates:
-- ✓ 3 sample products (vinyl, CD, cassette)
-- ✓ 5 product variants
-- ✓ Inventory records with realistic stock levels
-- ✓ Sample customer and addresses
-- ✓ Test order with order items
-- ✓ Stock movement records
```

### 4. `assistant-sync.ts`
**Purpose**: Refresh the admin copilot knowledge base embeddings from the project docs.
**When to use**: After updating documentation that the assistant should cite or before deploys where you want pre-seeded embeddings.
**How to run**:

```bash
# Ensure SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL, and OPENAI_API_KEY are set
npm run assistant:sync            # incremental refresh (skips unchanged docs)
npm run assistant:sync -- --force # force re-embed all sources
```

The script invokes the same embedding pipeline used at runtime and prints progress/timing to stdout.

## How to Run Scripts

### Method 1: Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy and paste the script content
5. Click **Run** to execute

### Method 2: Command Line (Advanced)
```bash
# If you have psql installed and configured
psql "postgresql://postgres:[password]@[host]:5432/postgres" -f script_name.sql
```

## Execution Order

For initial setup, run scripts in this order:

1. **First**: Ensure your migrations are complete
2. **Second**: `setup_sample_data.sql` (optional, for testing)
3. **Third**: `grant_admin.sql` (required for admin access)
4. **Fourth**: `health_check.sql` (verify everything works)

## Script Safety

- ✅ All scripts use `ON CONFLICT DO NOTHING` to prevent duplicates
- ✅ Scripts check for existing data before inserting
- ✅ No destructive operations (no DROP or DELETE commands)
- ✅ All scripts provide feedback messages

## Troubleshooting

### "User not found" error
- User must exist in Supabase Auth first
- Invite user through Dashboard > Authentication > Users
- Or have them sign up at your application

### "Permission denied" errors
- Ensure you're running scripts as a database admin
- Check that RLS policies allow the operations
- Verify environment variables are set correctly

### "Function does not exist" errors
- Run your database migrations first
- Check that all migration files have been applied
- Verify functions exist in the public schema

## Monitoring

Run `health_check.sql` regularly to monitor:
- System health and data integrity
- Low stock alerts
- Failed payments or webhook issues
- Admin user access

## Support

If you encounter issues:
1. Check the error message carefully
2. Run `health_check.sql` to identify problems
3. Verify your database migrations are complete
4. Check Supabase dashboard logs
5. Refer to the main ADMIN_GUIDE.md for detailed troubleshooting
