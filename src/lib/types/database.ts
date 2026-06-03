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
export type TransferType = "release" | "refund";

/** display_name is the unique public username (case-insensitive). */
export interface Profile {
  id: string;
  display_name: string;
  role: ProfileRole;
  is_mediator: boolean;
  phone: string | null;
  created_at: string;
  updated_at: string;
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
