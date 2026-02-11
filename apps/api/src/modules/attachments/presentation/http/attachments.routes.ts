import type { FastifyPluginAsync } from "fastify";

export const attachmentRoutes: FastifyPluginAsync = async (app) => {
  app.post("/", async () => {
    return {
      message: "Attachment upload endpoint skeleton",
      rules: {
        maxSizeMb: 10,
        visibilities: ["INTERNAL", "EXTERNAL"]
      }
    };
  });
};
