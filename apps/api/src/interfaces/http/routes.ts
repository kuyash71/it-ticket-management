import type { FastifyPluginAsync } from "fastify";

import { healthRoutes } from "./health.routes";
import { authRoutes } from "../../modules/auth/presentation/http/auth.routes";
import { ticketsRoutes } from "../../modules/tickets/presentation/http/tickets.routes";
import { auditRoutes } from "../../modules/audit/presentation/http/audit.routes";
import { timelineRoutes } from "../../modules/timeline/presentation/http/timeline.routes";
import { attachmentRoutes } from "../../modules/attachments/presentation/http/attachments.routes";
import { notificationRoutes } from "../../modules/notifications/presentation/http/notifications.routes";
import { reportingRoutes } from "../../modules/reporting/presentation/http/reporting.routes";
import { complaintRoutes } from "../../modules/complaints/presentation/http/complaints.routes";

export const apiRoutes: FastifyPluginAsync = async (app) => {
  await app.register(healthRoutes);
  await app.register(authRoutes, { prefix: "/auth" });
  await app.register(ticketsRoutes);
  await app.register(auditRoutes, { prefix: "/audit" });
  await app.register(timelineRoutes, { prefix: "/timeline" });
  await app.register(attachmentRoutes, { prefix: "/attachments" });
  await app.register(notificationRoutes, { prefix: "/notifications" });
  await app.register(reportingRoutes, { prefix: "/reporting" });
  await app.register(complaintRoutes, { prefix: "/complaints" });
};
