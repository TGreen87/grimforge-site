# Obsidian Rite Records - Admin Panel

A complete Refine-based admin panel with an AI-powered Copilot assistant.

## Features

- **AI Copilot** (GPT-5.1) - Create products, draft articles, manage inventory via natural language
- **Full CRUD Operations** for all resources
- **Supabase Authentication** with role-based access control
- **Real-time Inventory Management** with stock movements tracking
- **Order Management** with status updates and fulfillment tracking
- **Customer Management** with order history
- **Audit Logging** for all system activities
- **Gothic Dark Theme** with Cinzel font

## AI Copilot

The Copilot is accessible from the header and can perform these actions:

| Action | Description |
|--------|-------------|
| `create_product_draft` | Create inactive product + variant + inventory |
| `create_product_full` | Full product with AI-generated copy, publish, hero update |
| `receive_stock` | Add inventory to existing variant |
| `lookup_order_status` | Query orders by number or email |
| `summarize_analytics` | Pull traffic/event highlights |
| `draft_article` | Create Journal article with AI content |
| `publish_article` | Publish existing draft |
| `update_campaign` | Update storefront hero/campaign |

The Copilot understands the metal music scene and generates genre-appropriate content.

## Resources

### Products
- Create, read, update products
- Manage product metadata (tags, featured status, limited edition flags)
- Track stock levels and SKUs
- Set pricing and release years

### Variants
- Product variations (size, color, etc.)
- Individual SKU management
- Variant-specific pricing
- Weight and dimensions for shipping

### Inventory
- Real-time stock levels (on hand, allocated, available)
- Reorder point management
- Receive stock action for bulk updates
- Stock movement history

### Orders
- View and manage customer orders
- Update order status (pending, paid, processing, shipped, delivered, cancelled, refunded)
- View order items and customer details
- Integration with Stripe payment data

### Customers
- Customer profiles with contact information
- Order history
- Address management
- Internal notes

### Audit Logs
- System activity tracking
- User actions logging
- Resource change history
- Filterable by event type

## Authentication

The admin panel uses Supabase Auth with role-based access control. Only users with the 'admin' role in the `user_roles` table can access the panel.

## Database Setup

Run the migration to create necessary tables:

```bash
# Run the migration
supabase migration up
```

The migration creates:
- variants
- inventory
- stock_movements
- customers
- addresses
- orders
- order_items
- audit_logs

All tables have Row Level Security (RLS) enabled with appropriate policies.

## Environment Variables

Required environment variables (see .env.example):
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## Stock Management

### Receive Stock Action
The inventory page includes a "Receive Stock" action that:
1. Creates a stock movement record
2. Updates inventory levels
3. Logs the transaction in audit logs
4. Provides immediate feedback

### Atomic Inventory Operations
The database includes an atomic `decrement_inventory` function for safe stock reduction during order processing.

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Access admin panel
http://localhost:3000/admin
```

## Production Deployment

The admin panel is configured to work with Netlify deployment:
- Uses Next.js 15.4 with App Router
- Configured for Netlify Runtime v5
- Environment variables managed through Netlify dashboard

## Security

- All admin operations require authentication
- RLS policies enforce access control at the database level
- Service role keys are never exposed to the client
- Audit logs track all modifications

## Custom Actions

### Receive Stock
Located in the inventory management page, this action allows bulk stock receipt with:
- Quantity input validation
- Optional notes for tracking
- Automatic stock movement creation
- Real-time inventory update

## Tech Stack

- **Framework**: Next.js 15.4 with App Router
- **Admin Framework**: Refine
- **UI Library**: Ant Design 5
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Type Safety**: TypeScript
- **Form Handling**: React Hook Form with Refine integration