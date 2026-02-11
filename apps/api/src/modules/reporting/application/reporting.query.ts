export interface ReportingSummary {
  averageResolutionTimeMinutes: number;
  slaComplianceRate: number;
  escalationCount: number;
  agentWorkload: Array<{
    agentId: string;
    activeTicketCount: number;
  }>;
}

export class ReportingQuery {
  async getSummary(): Promise<ReportingSummary> {
    return {
      averageResolutionTimeMinutes: 0,
      slaComplianceRate: 0,
      escalationCount: 0,
      agentWorkload: []
    };
  }
}
