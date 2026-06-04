/** PayMongo v2 transfer resource (flat or nested under attributes). */
export type PaymongoTransferResource = {
  id?: string;
  status?: string;
  reference_number?: string;
  provider_reference_number?: string | null;
  metadata?: unknown;
  attributes?: {
    status?: string;
    reference_number?: string;
    provider_reference_number?: string | null;
    metadata?: unknown;
  };
};

export function parsePaymongoTransferResource(
  data: PaymongoTransferResource | undefined
): {
  status?: string;
  providerReferenceNumber?: string;
} {
  if (!data) return {};
  const attrs = data.attributes ?? data;
  const providerRef = attrs.provider_reference_number;
  return {
    status: attrs.status ?? data.status,
    providerReferenceNumber:
      typeof providerRef === "string" && providerRef.trim()
        ? providerRef.trim()
        : undefined,
  };
}
