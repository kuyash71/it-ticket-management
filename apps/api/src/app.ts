import Fastify, { type FastifyInstance } from "fastify";

import { apiRoutes } from "./interfaces/http/routes";

export const buildApp = async (): Promise<FastifyInstance> => {
  const app = Fastify({ logger: true });

  await app.register(apiRoutes);
  return app;
};
