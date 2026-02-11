import type { AuditRecord } from "../domain/audit-record";

export class AuditService {
  async append(record: AuditRecord): Promise<void> {
    // Placeholder: persist to audit store (db/event stream)
    void record;
  }
}
