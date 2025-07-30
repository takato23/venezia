# Supabase Setup Guide for Venezia Ice Cream

This guide will help you set up Supabase as the database for the Venezia Ice Cream management system.

## Prerequisites

- Node.js installed
- A Supabase account (free tier is sufficient)

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Fill in the project details:
   - Name: `venezia-ice-cream`
   - Database Password: Choose a strong password
   - Region: Select the closest to your location
4. Click "Create new project" and wait for setup to complete

## Step 2: Get Your API Keys

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL**: `https://your-project.supabase.co`
   - **anon/public** key: For frontend use
   - **service_role** key: For backend use (keep this secret!)

## Step 3: Set Up Environment Variables

### Backend (.env)
Create a `.env` file in the `backend` folder:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key_here
SUPABASE_ANON_KEY=your_anon_public_key_here

# JWT Configuration
JWT_SECRET=your_jwt_secret_here

# Server Configuration
PORT=5002
```

### Frontend (.env)
Create a `.env` file in the root folder:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_public_key_here

# API Configuration
VITE_API_URL=http://localhost:5002/api
```

## Step 4: Run Database Migration

1. Go to the Supabase dashboard
2. Navigate to **SQL Editor**
3. Click "New query"
4. Copy the entire content of `backend/database/supabase-schema.sql`
5. Paste it in the SQL editor
6. Click "Run" to create all tables and indexes

## Step 5: Enable Row Level Security (RLS)

1. In Supabase dashboard, go to **Authentication** → **Policies**
2. The migration script already includes basic RLS policies
3. You can customize them based on your needs

## Step 6: Configure Authentication

1. Go to **Authentication** → **Providers**
2. Ensure "Email" provider is enabled
3. Configure email templates if needed
4. Set up your site URL and redirect URLs

## Step 7: Migrate Existing Data (Optional)

If you have existing data in SQLite:

```bash
cd backend
node scripts/migrate-to-supabase.js
```

## Step 8: Set Up Storage Buckets (Optional)

For file uploads (product images, etc.):

1. Go to **Storage** in Supabase dashboard
2. Create a new bucket called `products`
3. Set it to public if product images should be publicly accessible

## Step 9: Test the Connection

Start the backend server:

```bash
cd backend
npm start
```

You should see:
```
✅ Connected to Supabase successfully
🚀 Venezia Backend API with SQLite running on port 5002
```

## Step 10: Update Frontend Code

Replace the auth store import in your components:

```javascript
// Old
import { useAuthStore } from '../store/authStore';

// New
import { useAuthStore } from '../store/authStore.supabase';
```

## Features Available with Supabase

1. **Real-time Updates**: Subscribe to database changes
2. **Built-in Authentication**: Email/password, OAuth providers
3. **Row Level Security**: Fine-grained access control
4. **Storage**: File uploads and management
5. **Edge Functions**: Serverless functions
6. **Vector/AI Support**: pgvector for AI applications

## Troubleshooting

### Connection Issues
- Verify your API keys are correct
- Check if your IP is allowed in Supabase dashboard
- Ensure RLS policies allow your operations

### Authentication Issues
- Check if email provider is enabled
- Verify redirect URLs are configured
- Check browser console for detailed errors

### Performance
- Create appropriate indexes for your queries
- Use Supabase query performance analyzer
- Consider connection pooling for high traffic

## Next Steps

1. Set up Supabase Auth for user management
2. Configure real-time subscriptions for live updates
3. Set up automated backups in Supabase
4. Configure monitoring and alerts

## Support

- Supabase Documentation: https://supabase.com/docs
- Supabase Discord: https://discord.supabase.com
- GitHub Issues: For Venezia-specific issues