/** PayMongo v2 transfer resource (flat or nested under attributes). */
export type PaymongoTransferResource = {
  id?: string;
  status?: string;
  reference_number?: string;
  instruction_id?: string | null;
  metadata?: unknown;
  attributes?: {
    status?: string;
    reference_number?: string;
    instruction_id?: string | null;
    metadata?: unknown;
  };
};

export function extractInstructionId(
  metadata: unknown,
  topLevelInstructionId?: string | null
): string | undefined {
  if (metadata && typeof metadata === "object") {
    const id = (metadata as Record<string, unknown>).instruction_id;
    if (typeof id === "string" && id.trim()) return id.trim();
  }
  if (
    typeof topLevelInstructionId === "string" &&
    topLevelInstructionId.trim()
  ) {
    return topLevelInstructionId.trim();
  }
  return undefined;
}

export function parsePaymongoTransferResource(
  data: PaymongoTransferResource | undefined
): {
  status?: string;
  instructionId?: string;
} {
  if (!data) return {};
  const attrs = data.attributes ?? data;
  return {
    status: attrs.status ?? data.status,
    instructionId: extractInstructionId(
      attrs.metadata ?? data.metadata,
      attrs.instruction_id ?? data.instruction_id
    ),
  };
}
