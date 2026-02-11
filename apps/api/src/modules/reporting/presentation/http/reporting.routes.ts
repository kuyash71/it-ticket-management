import type { FastifyPluginAsync } from "fastify";

import { ReportingQuery } from "../../application/reporting.query";

const reportingQuery = new ReportingQuery();

export const reportingRoutes: FastifyPluginAsync = async (app) => {
  app.get("/summary", async () => {
    return reportingQuery.getSummary();
  });
};
