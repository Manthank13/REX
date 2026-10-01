# REX - India's Student Exchange Agent

## Backend / Database Setup (Supabase)

REX uses Supabase for its backend, including PostgreSQL, Row Level Security (RLS), and Realtime features.

### Prerequisites
1. Create a [Supabase](https://supabase.com) project.
2. Link your local project:
   `npx supabase link --project-ref <your-project-ref>`
3. Set your environment variables in `.env.local` (see `.env.example`):
   ```
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   ```

### Schema & Migrations
To apply the database schema, RLS policies, and seed data:
```bash
npx supabase db push
```

### Authentication
REX uses Supabase Auth (Email/Password). 
During the sign-up flow, users must select an institution which is then mapped to their `public.profiles` entry.

### Row Level Security (RLS)
RLS is strictly enforced on all tables. 
Users can only modify their own resources and participate in exchanges where they are either the requester or the resource owner. All queries implicitly use `auth.uid()`.

### Realtime Configuration
Supabase Realtime is enabled on the `exchange_requests` table. Subscriptions are scoped to individual exchanges, ensuring users only receive updates they are authorized to see based on RLS policies.

### Demo Accounts
For demonstration purposes, the seed data includes:
- Aarav Sharma (aarav@demo.rex / password123) - SRM Institute
- Vikram Patel (vikram@demo.rex / password123) - IIT Madras

### Supabase Edge Functions & Gemini Integration
If you intend to deploy agentic logic (like Gemini intent extraction) inside Supabase Edge Functions:
1. Initialize the edge function: `npx supabase functions new gemini-agent`
2. Securely set the `GEMINI_API_KEY` for the function:
   ```bash
   npx supabase secrets set GEMINI_API_KEY="your-secret-key"
   ```
*Note: Never place `GEMINI_API_KEY` inside `.env.local` or commit it to version control.*
