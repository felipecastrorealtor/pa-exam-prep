# PA Real Estate Exam Prep — v2.0 Setup Guide

## What's in this ZIP

```
pa-exam-prep/
├── app/                      # Next.js 14 App Router
│   ├── (auth)/               # Login, Register, Forgot/Reset Password
│   ├── (protected)/          # Study, Flashcards, Glossary, Achievements, Settings
│   ├── admin/                # Admin panel (server-side role check)
│   ├── api/                  # Route Handlers
│   │   ├── stripe/           # Checkout + Webhook
│   │   └── redeem-access-code/
│   └── subscribe/            # Subscribe / access-code redemption page
├── components/               # Shared React components
├── lib/
│   ├── supabase/             # client.ts (browser) + server.ts (SSR + admin)
│   └── stripe.ts             # Stripe client + helpers
├── netlify/functions/
│   ├── gemini-proxy.ts       # 🔐 Gemini AI — key NEVER sent to browser
│   └── stripe-webhook.ts     # Stripe events → Supabase sync
├── supabase/
│   ├── migrations/
│   │   └── 001_initial_schema.sql   # All tables + RLS + seed (units + achievements)
│   └── seed/
│       ├── 002_questions.sql        # 321 questions EN + ES (auto-generated)
│       └── 003_glossary.sql         # 129 glossary terms (auto-generated)
├── scripts/
│   ├── migrate-questions.py  # Re-run to regenerate 002_questions.sql
│   └── migrate-glossary.py   # Re-run to regenerate 003_glossary.sql
├── middleware.ts             # Auth + subscription + admin gate
├── .env.example              # Copy → .env.local and fill in
├── netlify.toml
├── next.config.js
├── package.json
└── tsconfig.json
```

---

## Step-by-step setup

### 1. Prerequisites
- Node 20 (use `nvm use 20`)
- Netlify CLI: `npm install -g netlify-cli`
- Supabase CLI (optional, for local dev): `brew install supabase/tap/supabase`

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
```bash
cp .env.example .env.local
# Edit .env.local — fill in all values
```

**Required values:**
| Variable | Where to get it |
|----------|----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same page |
| `SUPABASE_SERVICE_ROLE_KEY` | Same page (keep secret!) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe Dashboard → Developers → API keys |
| `STRIPE_SECRET_KEY` | Same page (keep secret!) |
| `STRIPE_WEBHOOK_SECRET` | After registering webhook (step 5) |
| `GEMINI_API_KEY` | [aistudio.google.com](https://aistudio.google.com) → API Keys (create NEW key — old one was revoked) |
| `STRIPE_PRICE_MONTHLY` | After creating Stripe product (step 4) |

### 4. Create Stripe products
In Stripe Dashboard:
1. Create product "PA Real Estate Exam Prep" — price: **$20.00/month recurring**
2. Copy the Price ID → `STRIPE_PRICE_MONTHLY`
3. Create a coupon: **25% off, duration=forever** → `STRIPE_COUPON_PROMO`
   - This gives $15/month when applied ($20 × 0.75 = $15)

### 5. Run Supabase migrations
```bash
# Push to your existing Supabase project (ccvvcdypwrcyoyfxyphk)
supabase db push

# OR run the SQL manually in Supabase Dashboard → SQL Editor:
# 1. Run: supabase/migrations/001_initial_schema.sql
# 2. Run: supabase/seed/002_questions.sql
# 3. Run: supabase/seed/003_glossary.sql
```

### 6. Register Stripe webhook
```bash
# Local dev (for testing):
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Production: Stripe Dashboard → Developers → Webhooks → Add endpoint
# URL: https://your-site.netlify.app/.netlify/functions/stripe-webhook
# Events: checkout.session.completed, customer.subscription.*, invoice.payment_*
# Copy the Signing Secret → STRIPE_WEBHOOK_SECRET
```

### 7. Local dev
```bash
npm run dev
# App: http://localhost:3000
# Login at: http://localhost:3000/login
```

### 8. Deploy to Netlify
```bash
# Connect to your Netlify site:
netlify link

# Add all env vars in Netlify Dashboard → Site Settings → Environment Variables
# (same as .env.local)

# Deploy:
netlify deploy --prod
```

---

## Granting admin access

In Supabase Dashboard → Table Editor → `profiles`, find your user row and change `role` to `admin`.

The admin panel at `/admin` will then be accessible. Server-side check — not just CSS hiding.

---

## Creating access codes (30-day free)

In Supabase Dashboard → SQL Editor:
```sql
INSERT INTO access_codes (code, type, duration_days, max_uses, notes)
VALUES ('LAUNCH30', 'free_30d', 30, 100, 'Launch promo — 30 days free');
```

Users enter the code at `/register` (during signup) or `/subscribe` (after signup).
No credit card required. Access expires after 30 days without auto-charge.

---

## Re-generating the question seed

If you update `pa_real_estate_v4.html` with new questions:
```bash
python3 scripts/migrate-questions.py \
    --html /path/to/pa_real_estate_v4.html \
    --out  supabase/seed/002_questions.sql
```
Then re-run the seed in Supabase SQL Editor.
