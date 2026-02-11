import type { AttachmentVisibility } from "@itsm/contracts";

export interface Attachment {
  id: string;
  ticketId: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  visibility: AttachmentVisibility;
  uploaderId: string;
  createdAt: string;
}
