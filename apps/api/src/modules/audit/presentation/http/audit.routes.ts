import type { FastifyPluginAsync } from "fastify";

export const auditRoutes: FastifyPluginAsync = async (app) => {
  app.get("/", async () => {
    return {
      message: "Audit module skeleton",
      retentionPolicy: "minimum 1 year"
    };
  });
};
