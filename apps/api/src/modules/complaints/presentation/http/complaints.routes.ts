import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";

import { CreateComplaintUseCase } from "../../application/create-complaint.use-case";

const createSchema = z.object({
  ticketId: z.string().min(1),
  reporterId: z.string().min(1),
  description: z.string().min(3)
});

const createComplaint = new CreateComplaintUseCase();

export const complaintRoutes: FastifyPluginAsync = async (app) => {
  app.post("/", async (request, reply) => {
    const payload = createSchema.parse(request.body);
    const created = await createComplaint.execute(payload);
    return reply.code(201).send(created);
  });
};
