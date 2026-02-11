import type { AttachmentVisibility } from "@itsm/contracts";

export interface AttachmentPolicyInput {
  sizeBytes: number;
  visibility: AttachmentVisibility;
}

const MAX_SIZE_BYTES = 10 * 1024 * 1024;

export const validateAttachment = (
  input: AttachmentPolicyInput
): { valid: boolean; reason?: string } => {
  if (input.sizeBytes > MAX_SIZE_BYTES) {
    return {
      valid: false,
      reason: "Attachment exceeds 10 MB"
    };
  }

  return { valid: true };
};
