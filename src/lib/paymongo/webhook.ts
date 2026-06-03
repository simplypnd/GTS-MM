import crypto from "crypto";

/** Parse Paymongo-Signature: t=...,te=...,li=... */
function parseSignatureHeader(header: string): {
  t: string;
  te?: string;
  li?: string;
  v1?: string;
} {
  const out: { t: string; te?: string; li?: string; v1?: string } = { t: "" };
  for (const part of header.split(",")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    const key = part.slice(0, eq).trim();
    const value = part.slice(eq + 1);
    if (key === "t") out.t = value;
    if (key === "te") out.te = value || undefined;
    if (key === "li") out.li = value || undefined;
    if (key === "v1") out.v1 = value || undefined;
  }
  return out;
}

function timingSafeEqualHex(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a, "hex");
    const bufB = Buffer.from(b, "hex");
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

/**
 * Verify PayMongo webhook per current docs: HMAC-SHA256 of `${t}.${rawBody}`.
 * Header uses te (test) and/or li (live), not v1-only.
 */
export function verifyWebhookSignature(
  payload: string,
  signatureHeader: string | null
): boolean {
  const secret = process.env.PAYMONGO_WEBHOOK_SECRET;
  if (!secret) return true;
  if (!signatureHeader) return false;

  const { t, te, li, v1 } = parseSignatureHeader(signatureHeader);
  if (!t) return false;

  const computed = crypto
    .createHmac("sha256", secret)
    .update(`${t}.${payload}`)
    .digest("hex");

  if (te && timingSafeEqualHex(computed, te)) return true;
  if (li && timingSafeEqualHex(computed, li)) return true;
  if (v1 && timingSafeEqualHex(computed, v1)) return true;

  return false;
}

type PaymongoWebhookEvent = {
  data?: {
    attributes?: {
      type?: string;
      livemode?: boolean;
      data?: {
        id?: string;
        type?: string;
        attributes?: {
          payment_intent_id?: string;
          status?: string;
        };
      };
    };
  };
};

export function getWebhookEventType(event: PaymongoWebhookEvent): string {
  return event.data?.attributes?.type ?? "";
}

/** Resolve payment_intent_id from payment.paid, payment_intent.succeeded, etc. */
export function extractPaymentIntentId(
  event: PaymongoWebhookEvent
): string | null {
  const inner = event.data?.attributes?.data;
  if (!inner) return null;

  if (inner.type === "payment" && inner.attributes?.payment_intent_id) {
    return inner.attributes.payment_intent_id;
  }

  if (inner.type === "payment_intent" && inner.id?.startsWith("pi_")) {
    return inner.id;
  }

  return null;
}
