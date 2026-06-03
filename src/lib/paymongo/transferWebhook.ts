export type TransferDbStatus = "pending" | "succeeded" | "failed";

export type TransferUpdate = {
  transferId: string;
  status: TransferDbStatus;
  transferRowId?: string;
  referenceNumber?: string;
};

function mapPaymongoStatus(raw: string | undefined): TransferDbStatus | null {
  if (!raw) return null;
  const s = raw.toLowerCase();
  if (s === "succeeded" || s === "success" || s === "paid") return "succeeded";
  if (s === "failed" || s === "failure") return "failed";
  if (s === "pending" || s === "processing") return "pending";
  return null;
}

function parseMetadata(
  metadata: unknown
): { transfer_row_id?: string } | undefined {
  if (!metadata || typeof metadata !== "object") return undefined;
  const m = metadata as Record<string, unknown>;
  const rowId = m.transfer_row_id;
  return typeof rowId === "string" ? { transfer_row_id: rowId } : undefined;
}

function fromTransferObject(obj: {
  id?: string;
  status?: string;
  reference_number?: string;
  metadata?: unknown;
}): TransferUpdate | null {
  if (!obj.id?.startsWith("tr_")) return null;
  const status = mapPaymongoStatus(obj.status);
  if (!status) return null;
  const meta = parseMetadata(obj.metadata);
  return {
    transferId: obj.id,
    status,
    transferRowId: meta?.transfer_row_id,
    referenceNumber: obj.reference_number,
  };
}

/** Parse PayMongo transfer callbacks / webhook payloads into a DB update. */
export function extractTransferUpdate(event: unknown): TransferUpdate | null {
  if (!event || typeof event !== "object") return null;
  const root = event as Record<string, unknown>;

  // Batch callback: { data: { transfers: [{ id, status, metadata }] } }
  const data = root.data as Record<string, unknown> | undefined;
  if (data?.transfers && Array.isArray(data.transfers) && data.transfers[0]) {
    const t = fromTransferObject(
      data.transfers[0] as {
        id?: string;
        status?: string;
        reference_number?: string;
        metadata?: unknown;
      }
    );
    if (t) return t;
  }

  // Direct transfer resource: { data: { id: tr_, attributes: { status, metadata } } }
  if (data?.id && typeof data.id === "string" && data.id.startsWith("tr_")) {
    const attrs = (data.attributes ?? data) as {
      status?: string;
      metadata?: unknown;
      reference_number?: string;
    };
    return fromTransferObject({
      id: data.id,
      status: attrs.status,
      metadata: attrs.metadata,
      reference_number: attrs.reference_number,
    });
  }

  // Nested webhook envelope (payment-style): data.attributes.data
  const outerAttrs = data?.attributes as
    | {
        type?: string;
        data?: {
          id?: string;
          type?: string;
          attributes?: {
            status?: string;
            metadata?: unknown;
            reference_number?: string;
          };
        };
      }
    | undefined;
  const inner = outerAttrs?.data;
  if (inner?.id?.startsWith("tr_")) {
    const attrs = inner.attributes ?? {};
    return fromTransferObject({
      id: inner.id,
      status: attrs.status,
      metadata: attrs.metadata,
      reference_number: attrs.reference_number,
    });
  }

  // Legacy flat shape: data.attributes.status on data.id
  const flatAttrs = data?.attributes as
    | {
        status?: string;
        metadata?: { transfer_row_id?: string };
        reference_number?: string;
      }
    | undefined;
  if (data?.id && typeof data.id === "string" && flatAttrs?.status) {
    const status = mapPaymongoStatus(flatAttrs.status);
    if (!status) return null;
    return {
      transferId: data.id,
      status,
      transferRowId: flatAttrs.metadata?.transfer_row_id,
      referenceNumber: flatAttrs.reference_number,
    };
  }

  return null;
}
