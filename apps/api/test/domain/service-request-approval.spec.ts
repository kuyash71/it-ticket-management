import { describe, expect, it } from "vitest";

import { CreateTicketUseCase } from "../../src/modules/tickets/application/use-cases/create-ticket.use-case";
import { ChangeStatusUseCase } from "../../src/modules/tickets/application/use-cases/change-status.use-case";
import { InMemoryTicketRepository } from "../../src/modules/tickets/infrastructure/repositories/in-memory-ticket.repository";

describe("service request approval invariant", () => {
  it("blocks RESOLVED transition while approval is pending", async () => {
    const repository = new InMemoryTicketRepository();
    const createTicket = new CreateTicketUseCase(repository);
    const changeStatus = new ChangeStatusUseCase(repository);

    const ticket = await createTicket.execute({
      type: "SERVICE_REQUEST",
      title: "Need software access",
      description: "Requesting IDE license",
      reporterId: "customer-1",
      urgency: "LOW",
      impact: "LOW",
      requiresApproval: true
    });

    await changeStatus.execute({
      ticketId: ticket.id,
      actorId: "agent-1",
      actorRole: "AGENT",
      nextStatus: "IN_PROGRESS"
    });

    await expect(
      changeStatus.execute({
        ticketId: ticket.id,
        actorId: "agent-1",
        actorRole: "AGENT",
        nextStatus: "RESOLVED"
      })
    ).rejects.toThrow("APPROVAL_REQUIRED");
  });
});
