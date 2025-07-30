# Provider Management System Documentation

## Overview

The Provider Management System is a comprehensive solution for managing suppliers, purchase orders, and financial tracking for the Venezia ice cream shop. It supports multi-store operations with proper data isolation and includes features for inventory integration, payment tracking, and analytics.

## Database Schema

### Core Tables

1. **providers** - Stores supplier information
   - Basic info: name, contact person, phone, email, address
   - Financial: credit limit, current balance, payment terms
   - Organization: category, store assignment, active status

2. **provider_categories** - Categorizes providers (e.g., Dairy, Packaging, Equipment)

3. **provider_products** - Links providers to products they supply
   - Pricing information
   - Lead times and minimum order quantities
   - Preferred supplier flags

4. **purchase_orders** - Manages orders from providers
   - Status tracking (draft, sent, confirmed, received)
   - Financial totals with automatic calculation
   - Payment status tracking

5. **purchase_order_items** - Individual line items in orders

6. **provider_payments** - Tracks payments to providers

### Views

- **providers_with_balance** - Providers with calculated financial totals
- **purchase_orders_detailed** - Orders with provider information
- **provider_product_price_history** - Historical pricing data

## API Endpoints

### Provider Management

```bash
# Get all providers
GET /api/providers
Query params: category_id, is_active, search, store_id

# Get single provider
GET /api/providers/:id

# Create provider
POST /api/providers
Body: { name, contact_person, phone, email, address, cuit, category_id, notes, payment_terms, credit_limit }

# Update provider
PUT /api/providers/:id

# Delete provider (soft delete if has orders)
DELETE /api/providers/:id
```

### Category Management

```bash
# Get all categories
GET /api/provider-categories

# Create category
POST /api/provider-categories
Body: { name, description }
```

### Provider Products

```bash
# Get provider products
GET /api/providers/:id/products

# Add product to provider
POST /api/providers/:id/products
Body: { product_id, product_name, unit_cost, lead_time_days, minimum_order_quantity }

# Update provider product
PUT /api/providers/:providerId/products/:productId

# Remove product from provider
DELETE /api/providers/:providerId/products/:productId
```

### Purchase Orders

```bash
# Get all purchase orders
GET /api/purchase-orders
Query params: provider_id, status, payment_status, store_id, start_date, end_date

# Get single order
GET /api/purchase-orders/:id

# Create order
POST /api/purchase-orders
Body: { provider_id, expected_delivery_date, items: [...], notes }

# Update order
PUT /api/purchase-orders/:id

# Delete order (draft only)
DELETE /api/purchase-orders/:id

# Receive order items
POST /api/purchase-orders/:id/receive
Body: { items: [{ product_id, received_quantity }] }

# Generate PDF
GET /api/purchase-orders/:id/pdf
```

### Payment Tracking

```bash
# Record payment
POST /api/provider-payments
Body: { provider_id, purchase_order_id, amount, payment_method, reference_number }

# Get payments
GET /api/provider-payments
Query params: provider_id, purchase_order_id, start_date, end_date
```

### Analytics & Reports

```bash
# Provider analytics
GET /api/providers/:id/analytics
Query params: start_date, end_date

# Spending report
GET /api/reports/spending
Query params: start_date, end_date, store_id

# Product price history
GET /api/providers/:providerId/products/:productId/price-history

# Preferred providers for product
GET /api/products/:productId/preferred-providers
```

## Features

### 1. Credit Limit Management
- Automatic credit limit checking when creating orders
- Real-time balance tracking
- Prevents orders that exceed credit limits

### 2. Order Workflow
- Status progression: draft → sent → confirmed → partial/received
- Partial receipt handling
- Automatic status updates based on received quantities

### 3. Financial Tracking
- Automatic calculation of order totals
- Payment status tracking (pending, partial, paid)
- Outstanding balance calculations
- Spending analytics by provider and category

### 4. Multi-Store Support
- Store-level data isolation through RLS policies
- Provider assignments to specific stores
- Store-filtered reporting

### 5. Product Integration
- Link providers to products they supply
- Track pricing history
- Identify preferred suppliers
- Support for automatic reordering

## Usage Examples

### Creating a Provider
```javascript
const provider = await Provider.create({
  name: "Dairy Fresh Ltd",
  contact_person: "John Smith",
  phone: "+54-11-4567-8900",
  email: "john@dairyfresh.com",
  address: "123 Milk St, Buenos Aires",
  cuit: "20-12345678-9",
  category_id: "dairy-category-uuid",
  payment_terms: "Net 30",
  credit_limit: 50000.00,
  store_id: "store-uuid"
});
```

### Creating a Purchase Order
```javascript
const order = await Provider.createPurchaseOrder({
  provider_id: "provider-uuid",
  expected_delivery_date: "2024-01-15",
  items: [
    {
      product_id: "product-uuid",
      product_name: "Heavy Cream",
      quantity: 20,
      unit: "liters",
      unit_cost: 150.00
    }
  ],
  tax_amount: 300.00,
  shipping_cost: 50.00,
  notes: "Urgent delivery needed"
});
```

### Recording a Payment
```javascript
const payment = await Provider.recordPayment({
  provider_id: "provider-uuid",
  purchase_order_id: "order-uuid",
  amount: 3350.00,
  payment_method: "transfer",
  reference_number: "TRF-12345",
  notes: "Payment for PO-2024-00001"
});
```

### Getting Provider Analytics
```javascript
const analytics = await Provider.getProviderAnalytics("provider-uuid", {
  start_date: "2024-01-01",
  end_date: "2024-01-31"
});

// Returns:
{
  total_purchases: 150000.00,
  total_payments: 120000.00,
  pending_amount: 30000.00,
  order_count: 12,
  average_order_value: 12500.00,
  top_products: [...],
  monthly_purchases: [...]
}
```

## Security

- Row Level Security (RLS) policies enforce store-level data isolation
- Only authenticated users can access provider data
- Users can only see providers assigned to their stores
- Draft orders can only be deleted by their creators

## Best Practices

1. **Always check credit limits** before creating large orders
2. **Use categories** to organize providers effectively
3. **Track preferred providers** for frequently ordered products
4. **Regularly review analytics** to optimize spending
5. **Keep payment records updated** for accurate balance tracking
6. **Use the PDF generation** for official purchase orders
7. **Implement proper error handling** for all API calls

## Migration Notes

When migrating from SQLite to Supabase:
1. Run the `supabase-providers-schema.sql` to create tables
2. The system automatically falls back to SQLite if Supabase is unavailable
3. All features are available in both database modes
4. Data can be migrated using the export/import utilities