import { useMemo, useState } from "react";

import type { TicketViewModel } from "../models/ticket-view-model";

const INITIAL_TICKETS: TicketViewModel[] = [
  {
    id: "TCK-1001",
    type: "INCIDENT",
    title: "VPN access issue",
    description: "Customer cannot connect to VPN",
    status: "IN_PROGRESS",
    priority: "HIGH",
    urgency: "HIGH",
    impact: "MEDIUM",
    reporterId: "user-1",
    assigneeId: "agent-1",
    allowedActions: ["REQUEST_INFO", "RESOLVE", "ADD_WORKLOG"],
    slaRiskLevel: "WARNING",
    version: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    timeline: [
      {
        id: "ev-1",
        type: "StatusChanged",
        content: "Ticket moved from NEW to IN_PROGRESS",
        visibility: "EXTERNAL",
        createdAt: new Date().toISOString()
      }
    ]
  }
];

export const useTicketBoard = () => {
  const [tickets] = useState<TicketViewModel[]>(INITIAL_TICKETS);
  const [selectedId, setSelectedId] = useState<string>(INITIAL_TICKETS[0]?.id ?? "");

  const selectedTicket = useMemo(() => {
    return tickets.find((ticket) => ticket.id === selectedId) ?? null;
  }, [selectedId, tickets]);

  return {
    tickets,
    selectedId,
    selectedTicket,
    setSelectedId
  };
};
