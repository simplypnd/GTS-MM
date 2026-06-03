export type PaymentQrFields = {
  qr_image_url: string | null;
  expires_at: string | null;
  status?: string | null;
};

export function isQrActive(qr: PaymentQrFields | null | undefined): boolean {
  if (!qr?.qr_image_url || !qr.expires_at) return false;
  if (qr.status === "paid") return false;
  return new Date(qr.expires_at).getTime() > Date.now();
}
