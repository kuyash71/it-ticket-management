import type { FastifyPluginAsync } from "fastify";

export const authRoutes: FastifyPluginAsync = async (app) => {
  app.get("/me/permissions", async () => {
    return {
      note: "JWT + RBAC integration belongs to implementation phase",
      roles: ["CUSTOMER", "AGENT", "MANAGER"]
    };
  });
};
