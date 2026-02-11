export interface AuditRecord {
  id: string;
  ticketId?: string;
  actorId?: string;
  action: string;
  reason?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}
