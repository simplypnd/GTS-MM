# GTS Escrow

Pseudo-escrow webapp: buyers pay via **PayMongo QR Ph**, funds stay on your platform wallet until release/refund via **batch_transfers**, with **Supabase** auth and realtime chat.

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind
- Supabase (Auth, Postgres, Realtime)
- PayMongo (Payment Intents + QRPH, Wallet disbursements)

## Setup

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Run the SQL in [`supabase/migrations/001_initial.sql`](supabase/migrations/001_initial.sql) in the SQL editor (once per project; skip if types/tables already exist).
3. Run [`supabase/migrations/002_signup_no_public_role.sql`](supabase/migrations/002_signup_no_public_role.sql) (locks signup roles; admin-only mediators).
4. Run [`supabase/migrations/003_registration_username_unique.sql`](supabase/migrations/003_registration_username_unique.sql) (unique username on `profiles.display_name`, signup trigger hardening).

   Before `003`, resolve duplicate display names if any:

   ```sql
   SELECT lower(trim(display_name)), count(*) FROM profiles
   GROUP BY 1 HAVING count(*) > 1;
   ```

5. Enable **Realtime** for the `messages` table (migration adds it to publication).
6. Copy URL, anon key, and service role key.
7. Under **Authentication → URL Configuration**, set:
   - **Site URL:** `https://app.gtseller.shop` (or your production domain)
   - **Redirect URLs:** `https://app.gtseller.shop/auth/callback`
   - For local dev, also add: `http://localhost:3000/auth/callback`

   If Site URL is still `http://localhost:3000`, confirmation emails will redirect to localhost even in production.

   Password reset emails use the same `/auth/callback` with `?next=/reset-password` (handled automatically when users use **Forgot password?** on the login page).

   Built-in Supabase email has low rate limits; wait between test signups/resets, use custom SMTP, or disable **Confirm email** in dev to avoid `email rate limit exceeded`.

### 2. PayMongo

1. Get test/live keys from the PayMongo Dashboard.
2. Configure a webhook pointing to `{APP_URL}/api/webhooks/paymongo` for `payment.paid`, `qrph.expired`, and transfer callbacks.
3. Set wallet source account env vars for disbursements.

### 3. Environment

Copy [`.env.example`](.env.example) to `.env.local` and fill in values.

Set `NEXT_PUBLIC_APP_URL` to your public app URL (e.g. `https://app.gtseller.shop`). This is used for email confirmation redirects and PayMongo webhooks.

### 4. Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Test flow

### Auth (registration and password reset)

1. **Register** — pick a unique username (3–30 chars, letters/numbers/underscore); UI checks username and email availability before submit.
2. **Forgot password** — `/forgot-password` from login; open email link → set password on `/reset-password` → log in.

### Escrow

1. Register two users (no role selection at signup).
2. Each user adds payout accounts under **Settings → Payouts** as needed.
3. Create deals via **New deal** — pick **I am Buyer** or **I am Seller** per deal; invite counterparty by email.
4. Start payment → buyer generates QR Ph and pays (test mode).
5. Webhook marks deal **funded**; chat and ship/confirm actions unlock.
6. Buyer confirms → release to seller, or open dispute → mediator resolves.

### Promote a mediator (admin only)

Run in **Supabase Dashboard → SQL Editor** (not available in the public app):

```sql
UPDATE profiles SET is_mediator = TRUE WHERE id = '<user-uuid>';
```

Users cannot set `is_mediator` on themselves; the database rejects self-updates to that field.

## Architecture notes

- **Buyer/seller** are chosen per deal when creating a deal; the same user can be buyer on one deal and seller on another.
- Payout bank details live in **`payout_accounts`** (not PayMongo saved beneficiaries).
- PayMongo receives full `destination_account` on each `batch_transfers` call.

## Compliance

Escrow-like fund holding may require regulatory approval in the Philippines. Use as an MVP/internal prototype until legal review.
