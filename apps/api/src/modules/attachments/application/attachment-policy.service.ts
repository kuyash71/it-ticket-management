import {
  type AttachmentPolicyInput,
  validateAttachment
} from "../domain/attachment-policy";

export type ValidateAttachmentInput = AttachmentPolicyInput;

export const validateAttachmentPolicy = validateAttachment;
