# GTS Escrow

Pseudo-escrow webapp: buyers pay via **PayMongo QR Ph**, funds stay on your platform wallet until release/refund via **batch_transfers**, with **Supabase** auth and realtime chat.

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind
- Supabase (Auth, Postgres, Realtime)
- PayMongo (Payment Intents + QRPH, Wallet disbursements)

## Setup

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Run the SQL in [`supabase/migrations/001_initial.sql`](supabase/migrations/001_initial.sql) in the SQL editor.
3. Enable **Realtime** for the `messages` table (migration adds it to publication).
4. Copy URL, anon key, and service role key.

### 2. PayMongo

1. Get test/live keys from the PayMongo Dashboard.
2. Configure a webhook pointing to `{APP_URL}/api/webhooks/paymongo` for `payment.paid`, `qrph.expired`, and transfer callbacks.
3. Set wallet source account env vars for disbursements.

### 3. Environment

Copy [`.env.example`](.env.example) to `.env.local` and fill in values.

### 4. Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Test flow

1. Register three users: buyer, seller, mediator (register with role **mediator**, then confirm `is_mediator` in DB or run seed).
2. Seller and buyer add payout accounts under **Settings → Payouts**.
3. Buyer or seller creates a deal, invites counterparty by email.
4. Start payment → buyer generates QR Ph and pays (test mode).
5. Webhook marks deal **funded**; chat and ship/confirm actions unlock.
6. Buyer confirms → release to seller, or open dispute → mediator resolves.

### Promote a mediator

```sql
UPDATE profiles SET is_mediator = TRUE, role = 'mediator'
WHERE id = '<user-uuid>';
```

## Architecture notes

- **Buyer/seller** are fixed per deal (`deals.buyer_id`, `deals.seller_id`); immutable after payment starts.
- Payout bank details live in **`payout_accounts`** (not PayMongo saved beneficiaries).
- PayMongo receives full `destination_account` on each `batch_transfers` call.

## Compliance

Escrow-like fund holding may require regulatory approval in the Philippines. Use as an MVP/internal prototype until legal review.
