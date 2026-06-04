export type ProfileRole = "buyer" | "seller" | "mediator";
export type DealStatus =
  | "draft"
  | "awaiting_payment"
  | "funded"
  | "in_progress"
  | "completed"
  | "refunded"
  | "disputed"
  | "expired"
  | "cancelled";
export type ParticipantRole = "buyer" | "seller" | "mediator";
export type PartyRole = "buyer" | "seller";
export type TransferType = "release" | "refund" | "withdrawal";
export type WithdrawalProvider = "instapay" | "pesonet";
export type PaymentSource = "qrph" | "balance";
export type ThemePreference = "light" | "dark";

/** Layout/nav session fields loaded once per request for the signed-in user. */
export type SessionProfile = {
  display_name: string | null;
  is_mediator: boolean;
  is_admin: boolean;
  theme_preference: ThemePreference | null;
};

/** display_name is the unique public username (case-insensitive). */
export interface Profile {
  id: string;
  display_name: string;
  role: ProfileRole;
  is_mediator: boolean;
  is_admin: boolean;
  referral_code: string;
  referred_by_user_id: string | null;
  phone: string | null;
  balance_centavos: number;
  theme_preference: ThemePreference;
  created_at: string;
  updated_at: string;
}

export interface ReferralPayout {
  id: string;
  deal_id: string;
  referrer_id: string;
  referred_user_id: string;
  amount_centavos: number;
  created_at: string;
}

export type AdminStatsGranularity = "day" | "week" | "month";

export interface AdminStatsBucket {
  period_start: string;
  completed_deals: number;
  gross_fees_centavos: number;
  referral_rewards_centavos: number;
  net_revenue_centavos: number;
}

export interface AdminPlatformStats {
  totals: {
    completed_deals: number;
    gross_fees_centavos: number;
    referral_rewards_centavos: number;
    net_revenue_centavos: number;
  };
  buckets: AdminStatsBucket[];
}

export interface Deal {
  id: string;
  title: string;
  description: string | null;
  amount_centavos: number;
  currency: string;
  buyer_id: string;
  seller_id: string;
  status: DealStatus;
  platform_fee_bps: number;
  created_by: string;
  parties_locked_at: string | null;
  payment_source: PaymentSource | null;
  created_at: string;
  updated_at: string;
  buyer?: Profile;
  seller?: Profile;
}

export interface PayoutAccount {
  id: string;
  user_id: string;
  party_role: PartyRole;
  account_name: string;
  account_number: string;
  bank_bic: string;
  bank_name: string | null;
  is_default: boolean;
  verified_at: string | null;
}

export interface Message {
  id: string;
  deal_id: string;
  sender_id: string | null;
  sender_role: ParticipantRole | null;
  body: string;
  is_system: boolean;
  created_at: string;
  sender?: Profile;
}

export interface DealReview {
  id: string;
  deal_id: string;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface PublicProfileFields {
  id: string;
  display_name: string;
}

export interface DealPaymentQr {
  qr_image_url: string | null;
  expires_at: string | null;
  status?: string;
}

export interface PublicProfileDeal {
  id: string;
  counterparty_name: string;
  completed_at: string;
  role: "buyer" | "seller";
}

export interface WithdrawalTransfer {
  id: string;
  amount_centavos: number;
  fee_centavos: number;
  provider: string | null;
  status: string;
  instruction_id: string | null;
  recipient_role: PartyRole;
  destination_snapshot: {
    number?: string;
    name?: string;
    bic?: string;
  } | null;
  created_at: string;
  updated_at: string;
}

export interface PublicProfile {
  id: string;
  display_name: string;
  member_since: string;
  positive_percent: number | null;
  review_count: number;
  recent_deals: PublicProfileDeal[];
}

export interface Dispute {
  id: string;
  deal_id: string;
  opened_by: string;
  opened_by_role: PartyRole;
  reason: string;
  mediator_id: string | null;
  resolution: "release" | "refund" | "partial" | null;
  seller_amount_centavos: number | null;
  buyer_amount_centavos: number | null;
  resolution_notes: string | null;
  resolved_at: string | null;
  deal?: Deal;
}
