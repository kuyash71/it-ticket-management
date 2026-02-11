import type { AllowedActionsResponseDto, TicketDetailDto } from "@itsm/contracts";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

export const fetchTicketDetail = async (
  ticketId: string,
  role: "CUSTOMER" | "AGENT" | "MANAGER"
): Promise<TicketDetailDto> => {
  const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}?role=${role}`);
  if (!response.ok) {
    throw new Error("Failed to fetch ticket detail");
  }

  return (await response.json()) as TicketDetailDto;
};

export const fetchAllowedActions = async (
  ticketId: string,
  role: "CUSTOMER" | "AGENT" | "MANAGER"
): Promise<AllowedActionsResponseDto> => {
  const response = await fetch(
    `${API_BASE_URL}/tickets/${ticketId}/allowed-actions?role=${role}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch allowed actions");
  }

  return (await response.json()) as AllowedActionsResponseDto;
};
