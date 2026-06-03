const PAYMONGO_API = "https://api.paymongo.com";

function authHeader(secretKey: string): string {
  return `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`;
}

async function paymongoFetch<T>(
  path: string,
  options: RequestInit & { usePublicKey?: boolean } = {}
): Promise<T> {
  const secret = process.env.PAYMONGO_SECRET_KEY!;
  const publicKey = process.env.PAYMONGO_PUBLIC_KEY!;
  const key = options.usePublicKey ? publicKey : secret;

  const res = await fetch(`${PAYMONGO_API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader(key),
      ...options.headers,
    },
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(
      json?.errors?.[0]?.detail ?? json?.message ?? "PayMongo API error"
    );
  }
  return json as T;
}

export interface PaymentIntentResponse {
  data: {
    id: string;
    attributes: {
      client_key: string;
      status: string;
      amount: number;
      currency: string;
      next_action?: {
        code?: { image_url?: string };
      };
    };
  };
}

export async function createPaymentIntent(params: {
  amount: number;
  dealId: string;
  description: string;
}) {
  return paymongoFetch<PaymentIntentResponse>("/v1/payment_intents", {
    method: "POST",
    body: JSON.stringify({
      data: {
        attributes: {
          amount: params.amount,
          currency: "PHP",
          payment_method_allowed: ["qrph"],
          description: params.description,
          metadata: { deal_id: params.dealId },
        },
      },
    }),
  });
}

export async function createQrphPaymentMethod() {
  return paymongoFetch<{ data: { id: string } }>("/v1/payment_methods", {
    method: "POST",
    usePublicKey: true,
    body: JSON.stringify({
      data: { attributes: { type: "qrph" } },
    }),
  });
}

export async function attachPaymentMethod(
  paymentIntentId: string,
  paymentMethodId: string,
  clientKey: string
) {
  return paymongoFetch<PaymentIntentResponse>(
    `/v1/payment_intents/${paymentIntentId}/attach`,
    {
      method: "POST",
      usePublicKey: true,
      body: JSON.stringify({
        data: {
          attributes: {
            payment_method: paymentMethodId,
            client_key: clientKey,
          },
        },
      }),
    }
  );
}

export async function getPaymentIntent(id: string) {
  return paymongoFetch<PaymentIntentResponse>(`/v1/payment_intents/${id}`);
}

export interface BatchTransferResponse {
  data: {
    id: string;
    transfers: Array<{
      id: string;
      status: string;
      reference_number?: string;
    }>;
  };
}

export async function createBatchTransfer(params: {
  amount: number;
  destination: { number: string; name: string; bic: string };
  referenceNumber: string;
  description: string;
  callbackUrl: string;
  metadata: Record<string, string>;
  idempotencyKey: string;
}) {
  const source = {
    number: process.env.PAYMONGO_WALLET_ACCOUNT_NUMBER!,
    name: process.env.PAYMONGO_WALLET_ACCOUNT_NAME!,
    bic: process.env.PAYMONGO_WALLET_BIC ?? "PAEYPHM2XXX",
  };

  return paymongoFetch<BatchTransferResponse>("/v2/batch_transfers", {
    method: "POST",
    headers: {
      "Idempotency-Key": params.idempotencyKey,
    },
    body: JSON.stringify({
      transfers: [
        {
          provider: "instapay",
          amount: params.amount,
          currency: "PHP",
          purpose: "Disbursement",
          description: params.description,
          reference_number: params.referenceNumber,
          source_account: source,
          destination_account: params.destination,
          callback_url: params.callbackUrl,
          metadata: params.metadata,
        },
      ],
    }),
  });
}

export async function getTransfer(transferId: string) {
  return paymongoFetch<{ data: { status: string } }>(
    `/v2/transfers/${transferId}`
  );
}

export async function listReceivingInstitutions(provider = "instapay") {
  return paymongoFetch<{
    data: Array<{ provider_code: string; name: string }>;
  }>(`/v1/wallets/receiving_institutions?provider=${provider}`);
}

export { verifyWebhookSignature } from "@/lib/paymongo/webhook";
