import type { AuditRecord } from "../domain/audit-record";

export interface AuditRepository {
  create(record: AuditRecord): Promise<void>;
  listByTicket(ticketId: string): Promise<AuditRecord[]>;
}
