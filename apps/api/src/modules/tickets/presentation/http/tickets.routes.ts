import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";

import type { Role } from "@itsm/contracts";
import { resolveAllowedActions } from "../../domain/policies/allowed-actions.policy";
import { InMemoryTicketRepository } from "../../infrastructure/repositories/in-memory-ticket.repository";
import { CreateTicketUseCase } from "../../application/use-cases/create-ticket.use-case";
import { ChangeStatusUseCase } from "../../application/use-cases/change-status.use-case";
import { ChangePriorityUseCase } from "../../application/use-cases/change-priority.use-case";
import { ReassignTicketUseCase } from "../../application/use-cases/reassign-ticket.use-case";
import { ManagerOverrideUseCase } from "../../application/use-cases/manager-override.use-case";
import { toTicketDetailDto } from "../../application/dto/ticket.mapper";

const createSchema = z.object({
  type: z.enum(["INCIDENT", "SERVICE_REQUEST"]),
  title: z.string().min(3),
  description: z.string().min(3),
  reporterId: z.string().min(1),
  urgency: z.enum(["LOW", "MEDIUM", "HIGH"]),
  impact: z.enum(["LOW", "MEDIUM", "HIGH"]),
  requiresApproval: z.boolean().optional()
});

const changeStatusSchema = z.object({
  actorId: z.string().min(1),
  actorRole: z.enum(["CUSTOMER", "AGENT", "MANAGER"]),
  nextStatus: z.enum([
    "NEW",
    "IN_PROGRESS",
    "WAITING_FOR_CUSTOMER",
    "RESOLVED",
    "CLOSED"
  ]),
  reason: z.string().optional()
});

const changePrioritySchema = z.object({
  actorId: z.string().min(1),
  actorRole: z.enum(["CUSTOMER", "AGENT", "MANAGER"]),
  urgency: z.enum(["LOW", "MEDIUM", "HIGH"]),
  impact: z.enum(["LOW", "MEDIUM", "HIGH"]),
  reason: z.string().min(3)
});

const reassignSchema = z.object({
  actorId: z.string().min(1),
  actorRole: z.enum(["CUSTOMER", "AGENT", "MANAGER"]),
  assigneeId: z.string().min(1),
  reason: z.string().min(3)
});

const overrideSchema = z.object({
  actorId: z.string().min(1),
  actorRole: z.enum(["CUSTOMER", "AGENT", "MANAGER"]),
  forcedStatus: z.enum([
    "NEW",
    "IN_PROGRESS",
    "WAITING_FOR_CUSTOMER",
    "RESOLVED",
    "CLOSED"
  ]),
  reason: z.string().min(3)
});

const repository = new InMemoryTicketRepository();
const createTicket = new CreateTicketUseCase(repository);
const changeStatus = new ChangeStatusUseCase(repository);
const changePriority = new ChangePriorityUseCase(repository);
const reassignTicket = new ReassignTicketUseCase(repository);
const managerOverride = new ManagerOverrideUseCase(repository);

export const ticketsRoutes: FastifyPluginAsync = async (app) => {
  app.get("/tickets", async () => {
    const tickets = await repository.list();
    return tickets.map((ticket) => ticket.toPrimitives());
  });

  app.post("/tickets", async (request, reply) => {
    const payload = createSchema.parse(request.body);
    const created = await createTicket.execute(payload);
    return reply.code(201).send(created.toPrimitives());
  });

  app.get("/tickets/:ticketId", async (request, reply) => {
    const params = z.object({ ticketId: z.string() }).parse(request.params);
    const role =
      z
        .enum(["CUSTOMER", "AGENT", "MANAGER"])
        .catch("AGENT")
        .parse((request.query as { role?: Role }).role) ?? "AGENT";

    const ticket = await repository.findById(params.ticketId);
    if (!ticket) {
      return reply.code(404).send({
        errorCode: "TICKET_NOT_FOUND",
        message: `Ticket ${params.ticketId} was not found`
      });
    }

    return toTicketDetailDto(ticket, role);
  });

  app.post("/tickets/:ticketId/status", async (request, reply) => {
    const params = z.object({ ticketId: z.string() }).parse(request.params);
    const payload = changeStatusSchema.parse(request.body);

    try {
      const updated = await changeStatus.execute({
        ticketId: params.ticketId,
        actorId: payload.actorId,
        actorRole: payload.actorRole,
        nextStatus: payload.nextStatus,
        reason: payload.reason
      });
      return updated.toPrimitives();
    } catch (error) {
      const message = error instanceof Error ? error.message : "UNEXPECTED_ERROR";

      if (message === "TICKET_NOT_FOUND") {
        return reply.code(404).send({
          errorCode: "TICKET_NOT_FOUND",
          message: "Ticket not found"
        });
      }

      if (message.startsWith("INVALID_STATUS_TRANSITION")) {
        return reply.code(409).send({
          errorCode: "INVALID_STATUS_TRANSITION",
          message
        });
      }

      if (message === "APPROVAL_REQUIRED") {
        return reply.code(409).send({
          errorCode: "APPROVAL_REQUIRED",
          message: "Service request approval must be completed before RESOLVED"
        });
      }

      return reply.code(500).send({
        errorCode: "UNEXPECTED_ERROR",
        message: "Unexpected failure"
      });
    }
  });

  app.post("/tickets/:ticketId/priority", async (request, reply) => {
    const params = z.object({ ticketId: z.string() }).parse(request.params);
    const payload = changePrioritySchema.parse(request.body);

    try {
      const updated = await changePriority.execute({
        ticketId: params.ticketId,
        actorId: payload.actorId,
        actorRole: payload.actorRole,
        urgency: payload.urgency,
        impact: payload.impact,
        reason: payload.reason
      });
      return updated.toPrimitives();
    } catch (error) {
      const message = error instanceof Error ? error.message : "UNEXPECTED_ERROR";
      if (message === "TICKET_NOT_FOUND") {
        return reply.code(404).send({ errorCode: "TICKET_NOT_FOUND", message });
      }
      if (message === "UNAUTHORIZED_ACTION") {
        return reply.code(403).send({ errorCode: "UNAUTHORIZED_ACTION", message });
      }
      if (message === "APPROVAL_REQUIRED") {
        return reply.code(409).send({ errorCode: "APPROVAL_REQUIRED", message });
      }
      return reply.code(500).send({ errorCode: "UNEXPECTED_ERROR", message });
    }
  });

  app.post("/tickets/:ticketId/reassign", async (request, reply) => {
    const params = z.object({ ticketId: z.string() }).parse(request.params);
    const payload = reassignSchema.parse(request.body);

    try {
      const updated = await reassignTicket.execute({
        ticketId: params.ticketId,
        actorId: payload.actorId,
        actorRole: payload.actorRole,
        assigneeId: payload.assigneeId,
        reason: payload.reason
      });
      return updated.toPrimitives();
    } catch (error) {
      const message = error instanceof Error ? error.message : "UNEXPECTED_ERROR";
      if (message === "TICKET_NOT_FOUND") {
        return reply.code(404).send({ errorCode: "TICKET_NOT_FOUND", message });
      }
      if (message === "UNAUTHORIZED_ACTION") {
        return reply.code(403).send({ errorCode: "UNAUTHORIZED_ACTION", message });
      }
      if (message === "APPROVAL_REQUIRED") {
        return reply.code(409).send({ errorCode: "APPROVAL_REQUIRED", message });
      }
      return reply.code(500).send({ errorCode: "UNEXPECTED_ERROR", message });
    }
  });

  app.post("/tickets/:ticketId/override", async (request, reply) => {
    const params = z.object({ ticketId: z.string() }).parse(request.params);
    const payload = overrideSchema.parse(request.body);

    try {
      const updated = await managerOverride.execute({
        ticketId: params.ticketId,
        actorId: payload.actorId,
        actorRole: payload.actorRole,
        forcedStatus: payload.forcedStatus,
        reason: payload.reason
      });
      return updated.toPrimitives();
    } catch (error) {
      const message = error instanceof Error ? error.message : "UNEXPECTED_ERROR";
      if (message === "TICKET_NOT_FOUND") {
        return reply.code(404).send({ errorCode: "TICKET_NOT_FOUND", message });
      }
      if (message === "UNAUTHORIZED_ACTION") {
        return reply.code(403).send({ errorCode: "UNAUTHORIZED_ACTION", message });
      }
      return reply.code(500).send({ errorCode: "UNEXPECTED_ERROR", message });
    }
  });

  app.get("/tickets/:ticketId/allowed-actions", async (request, reply) => {
    const params = z.object({ ticketId: z.string() }).parse(request.params);
    const role = z
      .enum(["CUSTOMER", "AGENT", "MANAGER"])
      .parse((request.query as { role?: Role }).role);

    const ticket = await repository.findById(params.ticketId);
    if (!ticket) {
      return reply.code(404).send({
        errorCode: "TICKET_NOT_FOUND",
        message: "Ticket not found"
      });
    }

    return {
      ticketId: ticket.getId(),
      role,
      allowedActions: resolveAllowedActions(ticket.getStatus(), role)
    };
  });
};
