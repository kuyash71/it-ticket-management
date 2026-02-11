import type { FastifyPluginAsync } from "fastify";

export const notificationRoutes: FastifyPluginAsync = async (app) => {
  app.get("/rules", async () => {
    return {
      always: ["SLABreachRisk", "SLABreached"],
      conditional: ["TicketCreated", "StatusChanged", "AttachmentAdded"]
    };
  });
};
