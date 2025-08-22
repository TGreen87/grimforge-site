# Stripe Payment Integration Documentation

## Overview

This document details the complete Stripe payment integration for the Grimforge site, implementing PCI-compliant hosted checkout with Australian GST support via Stripe Tax.

## Architecture

### Key Components

1. **Checkout API** (`/app/api/checkout/route.ts`)
   - Creates Stripe Checkout sessions
   - Validates inventory availability
   - Creates pending orders in Supabase
   - Enforces Australian GST via Stripe Tax

2. **Webhook Handler** (`/app/api/stripe/webhook/route.ts`)
   - Processes Stripe webhook events
   - Updates order status on successful payment
   - Decrements inventory atomically
   - Creates comprehensive audit logs

3. **Stripe Configuration** (`/lib/stripe.ts`)
   - Initializes Stripe client with API version 2025-07-30.basil
   - Defines shipping options and configuration

4. **Audit Logger** (`/lib/audit-logger.ts`)
   - Records all payment events
   - Provides structured logging for compliance

## Environment Variables

Required environment variables (use staging aliases):

```env
# Stripe Configuration
STRIPE_SECRET_KEY_1=sk_test_...
STRIPE_WEBHOOK_SECRET_1=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Supabase Configuration
SUPABASE_URL_STAGING=https://your-project.supabase.co
SUPABASE_ANON_KEY_1=your-anon-key
SUPABASE_SERVICE_ROLE_1=your-service-role-key

# Site Configuration
SITE_URL_STAGING=https://your-site.com
```

## Checkout Flow

### 1. Client Initiates Checkout

```javascript
// Example client code
const response = await fetch('/api/checkout', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    variant_id: 'uuid-here',
    quantity: 2
  })
})

const { checkoutUrl } = await response.json()
window.location.href = checkoutUrl // Redirect to Stripe
```

### 2. Server-Side Processing

The checkout endpoint:
1. Validates variant exists and is active
2. Checks inventory availability
3. Creates pending order in database
4. Creates Stripe Checkout session with:
   - Australian GST via automatic_tax
   - Shipping collection for AU addresses
   - Customer email and phone collection
5. Returns checkout URL for redirect

### 3. Payment Processing

Customer completes payment on Stripe's hosted checkout page:
- PCI compliance maintained (zero scope)
- Australian GST automatically calculated
- Shipping address collected
- Payment methods handled by Stripe

### 4. Webhook Processing

On successful payment, webhook handler:
1. Verifies webhook signature
2. Updates order status to 'paid'
3. Creates/updates customer record
4. Saves shipping address
5. Decrements inventory atomically
6. Writes comprehensive audit log

## Database Schema

### Orders Table
```sql
- id: UUID
- order_number: String (ORR-XXXXXX format)
- customer_id: UUID (references customers)
- email: String
- status: Enum (pending, paid, processing, shipped, etc.)
- payment_status: Enum (pending, paid, failed, refunded)
- stripe_session_id: String
- stripe_payment_intent_id: String
- subtotal: Decimal
- tax: Decimal (from Stripe Tax)
- shipping: Decimal
- total: Decimal
- currency: String (AUD)
- metadata: JSONB
```

### Audit Log Table
```sql
- id: UUID
- event_type: String
- event_id: String (Stripe event ID)
- stripe_event_type: String
- order_id: UUID
- metadata: JSONB (comprehensive event data)
- created_at: Timestamp
```

## Security Features

1. **Webhook Signature Verification**
   - All webhooks verified using Stripe's constructEvent
   - Invalid signatures rejected with 400 status

2. **Server-Side Price Resolution**
   - Prices always fetched from database
   - Never trust client-provided prices

3. **Atomic Inventory Management**
   - Uses database function for atomic decrements
   - Prevents overselling via row-level locks

4. **Comprehensive Audit Logging**
   - All payment events logged
   - Includes timestamps, amounts, and status changes
   - Never logs sensitive card data

5. **Idempotency Keys**
   - Prevents duplicate checkout sessions
   - Format: `checkout_{order_id}_{timestamp}`

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run with UI
npm run test:ui

# Run with coverage
npm run test:coverage
```

### Test Coverage

- Checkout endpoint validation
- Inventory checking
- Order creation
- Stripe session creation
- Webhook signature verification
- Payment success handling
- Payment failure handling
- Session expiration
- Error handling

### Testing Stripe Webhooks Locally

```bash
# Install Stripe CLI
# https://stripe.com/docs/stripe-cli

# Login to Stripe
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Trigger test events
stripe trigger checkout.session.completed
```

## Monitoring and Debugging

### Audit Log Queries

```sql
-- View recent payment events
SELECT * FROM audit_log 
WHERE event_type LIKE 'payment%' 
ORDER BY created_at DESC 
LIMIT 50;

-- Check failed payments
SELECT * FROM audit_log 
WHERE event_type = 'payment.failed' 
ORDER BY created_at DESC;

-- Monitor webhook processing
SELECT * FROM audit_log 
WHERE event_type LIKE 'webhook%' 
ORDER BY created_at DESC;
```

### Common Issues and Solutions

1. **Webhook Signature Verification Failures**
   - Ensure STRIPE_WEBHOOK_SECRET_1 is correctly set
   - Check for middleware that modifies request body
   - Verify webhook endpoint URL in Stripe dashboard

2. **Inventory Decrement Failures**
   - Check database function exists: `decrement_inventory`
   - Verify service role key has proper permissions
   - Monitor for race conditions in high-traffic scenarios

3. **Tax Not Calculating**
   - Ensure automatic_tax.enabled is true
   - Verify Stripe Tax is activated in Stripe dashboard
   - Check customer address is provided

## Compliance

### PCI Compliance
- Zero PCI scope maintained
- No card data touches our servers
- All payment data handled by Stripe's certified infrastructure

### Australian GST
- Automatic 10% GST calculation via Stripe Tax
- Tax amounts stored separately in orders table
- Proper tax invoicing via Stripe

### Data Protection
- Customer data encrypted at rest (Supabase)
- HTTPS enforced in production
- Audit logs for compliance tracking

## Deployment Checklist

- [ ] Environment variables configured
- [ ] Webhook endpoint registered in Stripe dashboard
- [ ] Stripe Tax activated for Australian GST
- [ ] Database migrations applied
- [ ] Tests passing
- [ ] Webhook signature verification tested
- [ ] Success and cancel URLs configured
- [ ] Audit logging verified

## Support and Maintenance

### Regular Tasks
- Monitor audit logs for anomalies
- Review failed payment patterns
- Update Stripe API version quarterly
- Test webhook processing monthly

### Emergency Procedures
- Failed webhook: Check audit logs, manually reconcile if needed
- Inventory mismatch: Run inventory audit report
- Payment disputes: Check Stripe dashboard and audit logs

## API Reference

### POST /api/checkout

**Request:**
```json
{
  "variant_id": "uuid",
  "quantity": 2
}
```

**Response:**
```json
{
  "checkoutUrl": "https://checkout.stripe.com/pay/...",
  "sessionId": "cs_test_...",
  "orderId": "uuid"
}
```

### POST /api/stripe/webhook

Automatically called by Stripe. Handles:
- `checkout.session.completed`
- `payment_intent.payment_failed`
- `checkout.session.expired`
- `payment_intent.succeeded`

## Links and Resources

- [Stripe API Documentation](https://stripe.com/docs/api)
- [Stripe Tax Documentation](https://stripe.com/docs/tax)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Supabase Documentation](https://supabase.com/docs)