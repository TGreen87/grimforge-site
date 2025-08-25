# E2E Tests for Grimforge Site

## Overview

This directory contains comprehensive end-to-end tests for the Grimforge Site Next.js application, with a focus on the critical Stripe checkout flow and inventory management.

## Test Coverage

### 1. Checkout Flow (`tests/checkout.spec.ts`)
- Complete Stripe checkout with test card (4242424242424242)
- Order status verification (pending → paid)
- Inventory decrement verification
- Failed checkout scenarios (insufficient inventory, inactive products)
- Multiple quantity checkout
- Abandoned checkout handling
- Stripe webhook integration

### 2. Product Browsing (`tests/products.spec.ts`)
- Product catalog browsing
- Product search functionality
- Category filtering
- Product detail views
- Image galleries
- Product recommendations
- Reviews section
- Sorting options
- Pagination/infinite scroll

### 3. Cart Management (`tests/cart.spec.ts`)
- Add products to cart
- Update quantities
- Remove items
- Cart persistence
- Subtotal/total calculations
- Discount codes
- Cart preview
- Variant selection
- Clear cart

### 4. Admin Access (`tests/admin.spec.ts`)
- Authentication requirements
- Login/logout flow
- Product management (CRUD)
- Inventory management
- Order viewing
- Customer management
- Audit log access
- Session timeout handling

## Setup

### Prerequisites
1. Node.js 22.x
2. NPM (not Bun)
3. Environment variables configured

### Installation
```bash
# Install dependencies
npm install

# Install Playwright browsers
npm run test:e2e:install
```

### Environment Variables
Create a `.env.local` file with:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
STRIPE_SECRET_KEY=your_stripe_test_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_publishable_test_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Running Tests

### Local Development
```bash
# Run all tests
npm run test:e2e

# Run tests with UI
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Debug tests
npm run test:e2e:debug

# Run specific test file
npx playwright test tests/checkout.spec.ts

# Run specific test
npx playwright test -g "complete checkout with Stripe test mode"
```

### CI Environment
Tests run automatically on:
- Push to main/develop branches
- Pull requests to main
- Manual workflow dispatch

GitHub Actions workflow: `.github/workflows/e2e-tests.yml`

## Test Data

### Test Credit Card
- Number: `4242424242424242`
- Expiry: `12/34`
- CVC: `123`
- Postal: `42424`

### Test Customer
- Email: `test-{timestamp}@grimforge.test`
- Phone: `+61412345678`
- Address: Sydney, NSW, Australia

### Test Products
The test suite automatically creates test products:
- Test Vinyl - Dark Rituals ($45)
- Test CD - Ancient Spells ($25)
- Out of Stock Item (for error testing)
- Inactive Product (for validation testing)

## Test Structure

```
e2e/
├── fixtures/
│   └── test-data.ts        # Test data setup/teardown
├── utils/
│   └── test-helpers.ts     # Reusable test utilities
├── tests/
│   ├── checkout.spec.ts    # Checkout flow tests
│   ├── products.spec.ts    # Product browsing tests
│   ├── cart.spec.ts        # Cart management tests
│   └── admin.spec.ts       # Admin panel tests
└── global-setup.ts         # Global test setup
```

## Utilities

### Test Helpers (`utils/test-helpers.ts`)
- `fillStripeCheckout()` - Fill Stripe payment form
- `addProductToCart()` - Add product to cart
- `proceedToCheckout()` - Navigate to checkout
- `completeStripePayment()` - Complete payment
- `loginAsAdmin()` - Admin authentication
- `getInventoryCount()` - Get current inventory
- `getOrderDetails()` - Extract order information

### Test Data (`fixtures/test-data.ts`)
- `setupTestData()` - Create test products/inventory
- `cleanupTestData()` - Remove test data
- `resetInventory()` - Reset inventory counts
- `getInventory()` - Query current inventory
- `getOrder()` - Query order details

## Debugging

### View Test Reports
```bash
# After test run
npm run test:e2e:report
```

### Test Artifacts
- Screenshots: `test-results/` (on failure)
- Videos: `test-results/` (on failure)
- HTML Report: `playwright-report/`
- JUnit XML: `playwright-report/results.xml`

### Common Issues

1. **Stripe Checkout Not Loading**
   - Ensure Stripe test keys are configured
   - Check network connectivity
   - Verify product/variant IDs exist

2. **Inventory Tests Failing**
   - Run `setupTestData()` to reset test data
   - Check Supabase RLS policies
   - Verify service role key is configured

3. **Admin Tests Failing**
   - Ensure test admin user exists
   - Check authentication cookies
   - Verify admin role in Supabase

## CI/CD Integration

### GitHub Actions
The workflow runs tests on:
- Ubuntu latest
- Node 22.x
- Chromium, Firefox, WebKit browsers

### Artifacts
Test results are uploaded as artifacts:
- Reports retained for 7 days
- Videos retained for 3 days (on failure)

## Best Practices

1. **Test Isolation**: Each test should be independent
2. **Data Cleanup**: Always cleanup test data
3. **Explicit Waits**: Use proper wait conditions
4. **Error Handling**: Test both success and failure paths
5. **Descriptive Names**: Clear test descriptions
6. **Reusable Utilities**: Extract common operations

## Maintenance

### Adding New Tests
1. Create test file in `tests/` directory
2. Import utilities from `utils/test-helpers`
3. Use test data from `fixtures/test-data`
4. Follow existing patterns

### Updating Test Data
1. Modify `fixtures/test-data.ts`
2. Update `setupTestData()` and `cleanupTestData()`
3. Run tests to verify changes

### Stripe Testing
For webhook testing in development:
```bash
# Install Stripe CLI
# https://stripe.com/docs/stripe-cli

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Trigger test events
stripe trigger checkout.session.completed
```

## Support

For issues or questions:
1. Check test output and artifacts
2. Review environment variables
3. Verify database/Stripe configuration
4. Check GitHub Actions logs for CI failures