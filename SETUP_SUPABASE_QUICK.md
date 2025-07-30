# Quick Supabase Setup for Venezia

Your Supabase project is configured! Now let's create the database schema.

## Step 1: Create Database Tables

1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/axmknxpmapomyegdaogl

2. Click on **SQL Editor** in the left sidebar

3. Click **New query**

4. Copy ALL the content from the file `backend/database/supabase-schema.sql`

5. Paste it in the SQL editor

6. Click **Run** (or press Ctrl+Enter)

You should see a success message saying the query executed successfully.

## Step 2: Verify Tables Were Created

1. Go to **Table Editor** in the left sidebar
2. You should see all these tables:
   - users
   - stores
   - customers
   - products
   - product_categories
   - providers
   - ingredients
   - recipes
   - recipe_ingredients
   - sales
   - sale_items
   - cash_flow
   - production_orders
   - inventory_transactions
   - temperature_logs
   - system_alerts

## Step 3: Test the Application

1. The backend is already running with Supabase
2. Start the frontend:
   ```bash
   cd /Users/santiagobalosky/Downloads/___venezia
   npm run dev
   ```

3. Open http://localhost:5173 in your browser

## Step 4: Create Your First User

Since we're now using Supabase Auth, you'll need to create a user:

1. The login page will use Supabase Auth
2. You can sign up with any email/password
3. Check your email for verification (if email confirmations are enabled)

## Troubleshooting

If you see any errors:

1. Check the browser console for detailed error messages
2. Verify all tables were created in Supabase
3. Make sure both .env files have the correct credentials
4. Check that Row Level Security (RLS) policies allow access

## Next Steps

1. Configure email settings in Supabase for password resets
2. Set up storage buckets for product images
3. Configure real-time subscriptions for live updates
4. Set up automated backups in Supabase dashboard