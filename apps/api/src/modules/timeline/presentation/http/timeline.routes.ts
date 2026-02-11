import type { FastifyPluginAsync } from "fastify";

export const timelineRoutes: FastifyPluginAsync = async (app) => {
  app.get("/:ticketId", async (request) => {
    const { ticketId } = request.params as { ticketId: string };
    return {
      ticketId,
      items: [],
      note: "Timeline implementation pending"
    };
  });
};
