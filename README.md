# GTS MM

Peer deals with **MidMan** fund protection: buyers pay via **PayMongo QR Ph** or wallet balance; funds stay held until release/refund credits party balances; withdraw to bank via **InstaPay** or **PESONet**. **Supabase** auth and realtime chat.

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
5. Run [`supabase/migrations/004_wallet_balance.sql`](supabase/migrations/004_wallet_balance.sql) (wallet balance, ledger, withdrawals).

   Before `003`, resolve duplicate display names if any:

   ```sql
   SELECT lower(trim(display_name)), count(*) FROM profiles
   GROUP BY 1 HAVING count(*) > 1;
   ```

6. Enable **Realtime** for the `messages` table (migration adds it to publication).
7. Copy URL, anon key, and service role key.
8. Under **Authentication → URL Configuration**, set:
   - **Site URL (production):** `https://app.gtseller.shop`
   - **Site URL (local dev only):** `http://localhost:3000` — switch back before shipping; if production Site URL is localhost, emails will point at localhost.
   - **Redirect URLs (add every URL you use):**
     - `https://app.gtseller.shop/auth/callback`
     - `https://app.gtseller.shop/reset-password`
     - `http://localhost:3000/auth/callback`
     - `http://localhost:3000/reset-password`

   **If reset/confirm links look like `http://localhost:3000/?code=...` (root, no `/auth/callback`):** Supabase rejected `redirectTo` because `/auth/callback` was missing from **Redirect URLs**. It falls back to **Site URL** and appends `?code=`. Add the callback URLs above, ensure `.env.local` has `NEXT_PUBLIC_APP_URL=http://localhost:3000` for local dev, then request a **new** reset email. The app also redirects `/?code=` → `/auth/callback` as a safety net.

   Under **Authentication → Email Templates**, reset/confirm links must use `{{ .ConfirmationURL }}` (default). Do not replace with `{{ .SiteURL }}` only.

   Password reset emails should redirect to `/reset-password` (not `/dashboard`). Users stay in recovery mode until they submit a new password; expired links show an error on `/forgot-password` instead of logging them in.

   **PKCE / code verifier:** Request the reset email and open the link in the **same browser** where you submitted the form. Auth codes are exchanged in the browser (`/auth/callback` and `/reset-password` use client-side `@supabase/ssr` cookies). Opening the email on another device will fail with “PKCE code verifier not found”.

   Built-in Supabase email has low rate limits; wait between test signups/resets, use custom SMTP, or disable **Confirm email** in dev to avoid `email rate limit exceeded`.

### 2. PayMongo

1. Get test/live keys from the PayMongo Dashboard.
2. Configure a webhook in PayMongo Dashboard:
   - **URL:** `https://app.gtseller.shop/api/webhooks/paymongo` (must be publicly reachable; localhost will not receive events)
   - **Events:** `payment.paid`, `payment_intent.succeeded`, `qrph.expired` (and transfer callbacks if using disbursements)
   - Copy the webhook **secret** into `PAYMONGO_WEBHOOK_SECRET` (must match; signature uses `Paymongo-Signature` with `te`/`li` fields)
3. Set wallet source account env vars for disbursements.

   If you already paid but the deal stays on “awaiting payment”, open the deal page as the buyer — it polls PayMongo every 5s and syncs status. You can also `POST /api/deals/{id}/sync-payment` while logged in.

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

### MidMan deals

1. Register two users (no role selection at signup).
2. Create deals via **New deal** — pick **I am Buyer** or **I am Seller** per deal; invite counterparty by email.
3. Buyer pays via **QR Ph** or **Pay with balance** (if balance ≥ deal amount).
4. Webhook or balance payment marks deal **funded**; seller taps **Delivered**.
5. Buyer taps **Received** → seller balance is credited; withdraw at **/withdraw** (InstaPay ₱10 fee or free PESONet).
6. Payout accounts under **Settings → Payouts** are required only for bank withdrawals.
7. Disputes → mediator resolves; funds credit to balances.

### Promote a mediator (admin only)

Run in **Supabase Dashboard → SQL Editor** (not available in the public app):

```sql
UPDATE profiles SET is_mediator = TRUE WHERE id = '<user-uuid>';
```

Users cannot set `is_mediator` on themselves; the database rejects self-updates to that field.

## Architecture notes

- **Buyer/seller** are chosen per deal when creating a deal; the same user can be buyer on one deal and seller on another.
- Payout bank details live in **`payout_accounts`** (used for `/withdraw` only).
- Deal releases credit **`profiles.balance_centavos`**; PayMongo `batch_transfers` run on withdraw.

## Compliance

MidMan-style fund holding may require regulatory approval in the Philippines. Use as an MVP/internal prototype until legal review.
