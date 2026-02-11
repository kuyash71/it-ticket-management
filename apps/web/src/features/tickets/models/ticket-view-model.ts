import type { TicketDetailDto } from "@itsm/contracts";

export interface TicketViewModel extends TicketDetailDto {
  timeline: Array<{
    id: string;
    type: string;
    content: string;
    visibility: "INTERNAL" | "EXTERNAL";
    createdAt: string;
  }>;
}
