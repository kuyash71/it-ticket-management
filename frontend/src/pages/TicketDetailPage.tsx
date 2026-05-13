import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent, ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { http } from "../api/http";
import { useRole } from "../auth/useRole";
import { SlaPanel } from "../components/ticket/SlaPanel";
import {
  ApproveDialog,
  ChangePriorityDialog,
  ConfirmCloseDialog,
  ConfirmResumeDialog,
  ForceCloseDialog,
  OverrideStatusDialog,
  ReassignDialog,
  RejectDialog,
  ResolveDialog,
} from "../components/ticket/TicketActionDialogs";
import { Avatar } from "../components/ui/Avatar";
import { PriorityBadge, StatusBadge, TypeBadge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorBanner } from "../components/ui/ErrorBanner";
import { Field } from "../components/ui/Field";
import {
  IconAlertCircle,
  IconArrowLeft,
  IconArrowRight,
  IconCheckCircle,
  IconClock,
  IconDownload,
  IconMessageSquare,
  IconPaperclip,
  IconRefresh,
  IconSettings,
  IconUser,
  IconWrench
} from "../components/ui/Icon";
import { Select, Textarea } from "../components/ui/Input";
import { LoadingState } from "../components/ui/Spinner";
import { useToast } from "../components/ui/Toast";
import { formatActor, formatDateTime, formatRelative } from "../lib/format";
import type {
  AddCommentPayload,
  Attachment,
  ChangePriorityPayload,
  ForceClosePayload,
  OverrideStatusPayload,
  ReassignPayload,
  ResolveTicketPayload,
  Ticket,
  TicketAction,
  TicketStatus,
  TimelineEvent,
  Visibility,
} from "../types/api";
import { PLAIN_STATUS_TRANSITIONS } from "../types/api";

const COMMENT_MAX = 10000;

const STATUS_KEY: Record<TicketStatus, string> = {
  NEW: "status.new",
  IN_PROGRESS: "status.in_progress",
  WAITING_FOR_CUSTOMER: "status.waiting",
  RESOLVED: "status.resolved",
  CLOSED: "status.closed"
};

const STATUS_ICON: Record<TicketStatus, ReactNode> = {
  NEW: <IconAlertCircle size={14} aria-hidden />,
  IN_PROGRESS: <IconWrench size={14} aria-hidden />,
  WAITING_FOR_CUSTOMER: <IconClock size={14} aria-hidden />,
  RESOLVED: <IconCheckCircle size={14} aria-hidden />,
  CLOSED: <IconCheckCircle size={14} aria-hidden />
};

type Props = {
  ticketId: string;
  onBack: () => void;
};

type DialogKind = "resolve" | "confirmClose" | "confirmResume" | "forceClose" | "priority" | "reassign" | "override" | "approve" | "reject" | null;

export const TicketDetailPage = ({ ticketId, onBack }: Props) => {
  const { t } = useTranslation();
  const { isCustomer, isAgent, isManager } = useRole();
  const toast = useToast();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transitioning, setTransitioning] = useState<TicketStatus | null>(null);
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [actionSubmitting, setActionSubmitting] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [tk, tl, at] = await Promise.all([
        http.get<Ticket>(`/api/tickets/${ticketId}`),
        http.get<TimelineEvent[]>(`/api/tickets/${ticketId}/timeline`),
        http.get<Attachment[]>(`/api/tickets/${ticketId}/attachments`)
      ]);
      setTicket(tk.data);
      setTimeline(tl.data);
      setAttachments(at.data);
    } catch {
      setError(t("error.fetch_failed"));
    } finally {
      setLoading(false);
    }
  }, [ticketId, t]);

  const refreshAttachments = useCallback(async () => {
    try {
      const res = await http.get<Attachment[]>(`/api/tickets/${ticketId}/attachments`);
      setAttachments(res.data);
    } catch { /* non-critical */ }
  }, [ticketId]);

  const uploadFile = async (file: File, visibility: Visibility) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("visibility", visibility);
      await http.post(`/api/tickets/${ticketId}/attachments/upload`, fd, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      await refreshAttachments();
      await refreshTimeline();
      toast.success(t("attachment.uploaded"));
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      toast.error(axiosErr?.response?.data?.message ?? t("attachment.upload_failed"));
    } finally {
      setUploading(false);
    }
  };

  const downloadAttachment = async (att: Attachment) => {
    try {
      const res = await http.get<Blob>(
        `/api/tickets/${ticketId}/attachments/${att.id}/download`,
        { responseType: "blob" }
      );
      const blob = res.data;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = att.fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast.error(t("attachment.download_failed"));
    }
  };

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  const refreshTimeline = useCallback(async () => {
    try {
      const res = await http.get<TimelineEvent[]>(`/api/tickets/${ticketId}/timeline`);
      setTimeline(res.data);
    } catch {
      /* non-critical */
    }
  }, [ticketId]);

  const handlePlainTransition = async (target: TicketStatus) => {
    setTransitioning(target);
    try {
      const res = await http.patch<Ticket>(`/api/tickets/${ticketId}/status`, { status: target });
      setTicket(res.data);
      await refreshTimeline();
      toast.success(t("ticket.status.change"), t(STATUS_KEY[target]));
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      toast.error(axiosErr?.response?.data?.message ?? t("error.transition_failed"));
    } finally {
      setTransitioning(null);
    }
  };

  const handleTakeOwnership = async () => {
    setActionSubmitting(true);
    try {
      const res = await http.post<Ticket>(`/api/tickets/${ticketId}/take-ownership`);
      setTicket(res.data);
      await refreshTimeline();
      toast.success(t("ticket.take_ownership.success"));
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      toast.error(axiosErr?.response?.data?.message ?? t("error.action_failed"));
    } finally {
      setActionSubmitting(false);
    }
  };

  const runVerifiedAction = async <T,>(
    request: () => Promise<{ data: Ticket }>,
    onSuccess: () => void,
    successKey: string,
    _input?: T,
  ) => {
    setActionSubmitting(true);
    try {
      const res = await request();
      setTicket(res.data);
      await refreshTimeline();
      toast.success(t(successKey));
      onSuccess();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      toast.error(axiosErr?.response?.data?.message ?? t("error.action_failed"));
    } finally {
      setActionSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="card"><LoadingState text={t("app.loading")} /></div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="page-container">
        <nav className="breadcrumb" aria-label={t("nav.breadcrumb")}>
          <button type="button" onClick={onBack}>{t("nav.tickets")}</button>
        </nav>
        <ErrorBanner>{error ?? t("error.fetch_failed")}</ErrorBanner>
        <div style={{ marginTop: "var(--space-3)" }}>
          <Button variant="ghost" leadingIcon={<IconArrowLeft />} onClick={onBack}>
            {t("error.back_to_list")}
          </Button>
        </div>
      </div>
    );
  }

  const allowedActions = new Set<TicketAction>(ticket.allowedActions);
  // Plain transitions apply to agents/managers only, and exclude IN_PROGRESS for unapproved service requests.
  const canRunPlainTransitions = isAgent() || isManager();
  const plainTransitions = canRunPlainTransitions
    ? PLAIN_STATUS_TRANSITIONS[ticket.status].filter((target) => {
        // Block NEW→IN_PROGRESS and WAITING→IN_PROGRESS for unapproved service requests.
        if (target === "IN_PROGRESS" && ticket.type === "SERVICE_REQUEST" && ticket.approvalState === "PENDING") {
          return false;
        }
        return true;
      })
    : [];
  const hasAny = (...actions: TicketAction[]) => actions.some((a) => allowedActions.has(a));
  const canPostInternal = !isCustomer();

  return (
    <div className="page-container">
      <nav className="breadcrumb" aria-label={t("nav.breadcrumb")}>
        <button type="button" onClick={onBack}>{t("nav.tickets")}</button>
        <span className="breadcrumb-sep" aria-hidden="true">/</span>
        <span className="breadcrumb-current">#{ticket.id.slice(0, 8)}</span>
      </nav>

      <div className="detail-grid">
        <div className="detail-main">
          <header className="detail-header">
            <div className="detail-header-meta">
              <TypeBadge type={ticket.type} />
              <span>·</span>
              <span style={{ fontFamily: "var(--font-mono)" }}>#{ticket.id.slice(0, 8)}</span>
              <span>·</span>
              <span>{t("ticket.meta.updated")} {formatRelative(ticket.updatedAt)}</span>
            </div>
            <h1 className="detail-title">{ticket.title}</h1>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginTop: "var(--space-3)" }}>
              <StatusBadge status={ticket.status} />
              {!isCustomer() && <PriorityBadge priority={ticket.priority} />}
            </div>
            {ticket.description && (
              <p className="detail-description">{ticket.description}</p>
            )}
            {ticket.resolutionNote && (
              <div className="resolution-block" style={{
                marginTop: "var(--space-4)",
                padding: "var(--space-3) var(--space-4)",
                border: "1px solid var(--border)",
                borderLeft: "3px solid var(--color-success, #22c55e)",
                borderRadius: "var(--radius-md)",
                background: "var(--bg-subtle)",
              }}>
                <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", marginBottom: "var(--space-1)", fontWeight: "var(--weight-semibold)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                  {t("ticket.resolution_note")}
                </div>
                <div style={{ fontSize: "var(--text-sm)", color: "var(--text)", whiteSpace: "pre-wrap" }}>
                  {ticket.resolutionNote}
                </div>
              </div>
            )}
            {ticket.closeReason && ticket.status === "CLOSED" && (
              <div className="close-block" style={{
                marginTop: "var(--space-3)",
                padding: "var(--space-3) var(--space-4)",
                border: "1px solid var(--border)",
                borderLeft: "3px solid var(--text-muted)",
                borderRadius: "var(--radius-md)",
                background: "var(--bg-subtle)",
              }}>
                <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", marginBottom: "var(--space-1)", fontWeight: "var(--weight-semibold)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                  {t("ticket.close_reason")}
                </div>
                <div style={{ fontSize: "var(--text-sm)", color: "var(--text)", whiteSpace: "pre-wrap" }}>
                  {ticket.closeReason}
                </div>
              </div>
            )}
          </header>

          <section className="timeline" aria-label={t("ticket.timeline")}>
            <div className="timeline-header">
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                <IconMessageSquare size={16} aria-hidden />
                <strong style={{ fontSize: "var(--text-sm)" }}>{t("ticket.timeline")}</strong>
                <span className="text-muted text-xs">({timeline.length})</span>
              </div>
              <Button variant="ghost" size="sm" leadingIcon={<IconRefresh />} onClick={() => void refreshTimeline()}>
                {t("action.refresh")}
              </Button>
            </div>
            <div className="timeline-body">
              {timeline.length === 0 ? (
                <div className="timeline-empty">
                  <EmptyState
                    icon={<IconMessageSquare size={20} />}
                    title={t("ticket.timeline.empty")}
                  />
                </div>
              ) : (
                timeline.map((event) => <TimelineEntry key={event.id} event={event} />)
              )}
            </div>
          </section>

          {ticket.status !== "CLOSED" && allowedActions.has("ADD_COMMENT") && (
            <CommentComposer
              ticketId={ticketId}
              canPostInternal={canPostInternal}
              onAdded={(event) => setTimeline((prev) => [...prev, event])}
            />
          )}
        </div>

        <aside className="detail-side">
          {ticket.sla && <SlaPanel sla={ticket.sla} />}

          {(plainTransitions.length > 0 ||
            hasAny("TAKE_OWNERSHIP", "RESOLVE", "CONFIRM_CLOSE", "FORCE_CLOSE", "CHANGE_PRIORITY", "REASSIGN", "OVERRIDE_STATUS", "APPROVE_REQUEST", "REJECT_REQUEST", "REQUEST_INFO", "REOPEN_REQUEST")) && (
            <div className="side-section">
              <div className="side-section-header">{t("ticket.actions")}</div>
              <div className="side-section-body">
                <div className="status-actions">
                  {allowedActions.has("TAKE_OWNERSHIP") && (
                    <Button
                      variant="primary"
                      size="sm"
                      leadingIcon={<IconUser size={14} aria-hidden />}
                      onClick={() => void handleTakeOwnership()}
                      loading={actionSubmitting}
                      disabled={transitioning !== null}
                    >
                      {t("ticket.take_ownership.action")}
                    </Button>
                  )}

                  {allowedActions.has("REQUEST_INFO") && (
                    <Button
                      variant="primary"
                      size="sm"
                      leadingIcon={<IconArrowRight size={14} aria-hidden />}
                      onClick={() => setDialog("confirmResume")}
                      disabled={transitioning !== null || actionSubmitting}
                    >
                      {t("ticket.request_info.action")}
                    </Button>
                  )}

                  {allowedActions.has("REOPEN_REQUEST") && (
                    <Button
                      variant="default"
                      size="sm"
                      leadingIcon={<IconRefresh size={14} aria-hidden />}
                      onClick={() => void handlePlainTransition("IN_PROGRESS")}
                      loading={transitioning === "IN_PROGRESS"}
                      disabled={transitioning !== null || actionSubmitting}
                    >
                      {t("ticket.reopen.action")}
                    </Button>
                  )}

                  {plainTransitions.map((target) => (
                    <Button
                      key={target}
                      variant="default"
                      size="sm"
                      leadingIcon={STATUS_ICON[target]}
                      trailingIcon={<IconArrowRight />}
                      onClick={() => void handlePlainTransition(target)}
                      loading={transitioning === target}
                      disabled={transitioning !== null}
                    >
                      {t(STATUS_KEY[target])}
                    </Button>
                  ))}

                  {allowedActions.has("RESOLVE") && (
                    <Button
                      variant="primary"
                      size="sm"
                      leadingIcon={<IconCheckCircle size={14} aria-hidden />}
                      onClick={() => setDialog("resolve")}
                      disabled={actionSubmitting || transitioning !== null}
                    >
                      {t("ticket.resolve.action")}
                    </Button>
                  )}

                  {allowedActions.has("CONFIRM_CLOSE") && (
                    <Button
                      variant="primary"
                      size="sm"
                      leadingIcon={<IconCheckCircle size={14} aria-hidden />}
                      onClick={() => setDialog("confirmClose")}
                      disabled={actionSubmitting}
                    >
                      {t("ticket.confirm_close.action")}
                    </Button>
                  )}

                  {allowedActions.has("REASSIGN") && (
                    <Button
                      variant="default"
                      size="sm"
                      leadingIcon={<IconUser size={14} aria-hidden />}
                      onClick={() => setDialog("reassign")}
                      disabled={actionSubmitting}
                    >
                      {t("ticket.reassign.action")}
                    </Button>
                  )}

                  {allowedActions.has("OVERRIDE_STATUS") && (
                    <Button
                      variant="default"
                      size="sm"
                      leadingIcon={<IconAlertCircle size={14} aria-hidden />}
                      onClick={() => setDialog("override")}
                      disabled={actionSubmitting}
                    >
                      {t("ticket.override.action")}
                    </Button>
                  )}

                  {allowedActions.has("FORCE_CLOSE") && (
                    <Button
                      variant="danger"
                      size="sm"
                      leadingIcon={<IconAlertCircle size={14} aria-hidden />}
                      onClick={() => setDialog("forceClose")}
                      disabled={actionSubmitting}
                    >
                      {t("ticket.force_close.action")}
                    </Button>
                  )}

                  {allowedActions.has("APPROVE_REQUEST") && (
                    <Button
                      variant="primary"
                      size="sm"
                      leadingIcon={<IconCheckCircle size={14} aria-hidden />}
                      onClick={() => setDialog("approve")}
                      disabled={actionSubmitting}
                    >
                      {t("approval.approve.action")}
                    </Button>
                  )}

                  {allowedActions.has("REJECT_REQUEST") && (
                    <Button
                      variant="danger"
                      size="sm"
                      leadingIcon={<IconAlertCircle size={14} aria-hidden />}
                      onClick={() => setDialog("reject")}
                      disabled={actionSubmitting}
                    >
                      {t("approval.reject.action")}
                    </Button>
                  )}

                  {allowedActions.has("CHANGE_PRIORITY") && (
                    <Button
                      variant="ghost"
                      size="sm"
                      leadingIcon={<IconSettings size={14} aria-hidden />}
                      onClick={() => setDialog("priority")}
                      disabled={actionSubmitting}
                    >
                      {t("ticket.priority.action")}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          <AttachmentsPanel
            attachments={attachments}
            allowedActions={allowedActions}
            uploading={uploading}
            onUpload={uploadFile}
            onDownload={downloadAttachment}
          />

          <div className="side-section">
            <div className="side-section-header">{t("ticket.details")}</div>
            <div className="side-section-body">
              <dl style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                <SideRow label={t("ticket.col.status")}>
                  <StatusBadge status={ticket.status} />
                </SideRow>
                <SideRow label={t("ticket.col.type")}>
                  <TypeBadge type={ticket.type} />
                </SideRow>
                <SideRow label={t("ticket.col.assignee")}>
                  {ticket.assigneeId ? (
                    <span className="text-sm" style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-2)" }}>
                      <Avatar name={formatActor(ticket.assigneeId)} size="sm" />
                      {formatActor(ticket.assigneeId)}
                    </span>
                  ) : (
                    <span className="text-muted text-sm">{t("ticket.assignee.unassigned")}</span>
                  )}
                </SideRow>
                {!isCustomer() && (
                  <>
                    <SideRow label={t("ticket.col.priority")}>
                      <PriorityBadge priority={ticket.priority} />
                    </SideRow>
                    <SideRow label={t("ticket.col.impact")}>
                      <span className="text-sm">{t(`impact.${ticket.impact.toLowerCase()}`)}</span>
                    </SideRow>
                    <SideRow label={t("ticket.col.urgency")}>
                      <span className="text-sm">{t(`urgency.${ticket.urgency.toLowerCase()}`)}</span>
                    </SideRow>
                  </>
                )}
                {ticket.approvalState && (
                  <SideRow label={t("ticket.col.approval")}>
                    <span className="text-sm">{t(`approval.${ticket.approvalState.toLowerCase()}`)}</span>
                  </SideRow>
                )}
                <SideRow label={t("ticket.meta.created")}>
                  <time dateTime={ticket.createdAt} className="text-sm">
                    {formatDateTime(ticket.createdAt)}
                  </time>
                </SideRow>
                <SideRow label={t("ticket.meta.updated")}>
                  <time dateTime={ticket.updatedAt} className="text-sm">
                    {formatDateTime(ticket.updatedAt)}
                  </time>
                </SideRow>
                {ticket.resolvedAt && (
                  <SideRow label={t("ticket.meta.resolved")}>
                    <time dateTime={ticket.resolvedAt} className="text-sm">
                      {formatDateTime(ticket.resolvedAt)}
                    </time>
                  </SideRow>
                )}
                {ticket.closedAt && (
                  <SideRow label={t("ticket.meta.closed")}>
                    <time dateTime={ticket.closedAt} className="text-sm">
                      {formatDateTime(ticket.closedAt)}
                    </time>
                  </SideRow>
                )}
                <SideRow label={t("ticket.meta.id")}>
                  <code style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)", color: "var(--text-secondary)" }}>
                    {ticket.id}
                  </code>
                </SideRow>
              </dl>
            </div>
          </div>
        </aside>
      </div>

      <ResolveDialog
        open={dialog === "resolve"}
        submitting={actionSubmitting}
        onClose={() => !actionSubmitting && setDialog(null)}
        onSubmit={(resolutionNote, resolutionCode) => {
          const payload: ResolveTicketPayload = { resolutionNote, resolutionCode };
          return runVerifiedAction(
            () => http.post<Ticket>(`/api/tickets/${ticketId}/resolve`, payload),
            () => setDialog(null),
            "ticket.resolve.success",
          );
        }}
      />

      <ConfirmCloseDialog
        open={dialog === "confirmClose"}
        submitting={actionSubmitting}
        onClose={() => !actionSubmitting && setDialog(null)}
        onSubmit={() =>
          runVerifiedAction(
            () => http.post<Ticket>(`/api/tickets/${ticketId}/confirm-close`),
            () => setDialog(null),
            "ticket.confirm_close.success",
          )
        }
      />

      <ForceCloseDialog
        open={dialog === "forceClose"}
        submitting={actionSubmitting}
        onClose={() => !actionSubmitting && setDialog(null)}
        onSubmit={(reason) => {
          const payload: ForceClosePayload = { reason };
          return runVerifiedAction(
            () => http.post<Ticket>(`/api/tickets/${ticketId}/force-close`, payload),
            () => setDialog(null),
            "ticket.force_close.success",
          );
        }}
      />

      <ChangePriorityDialog
        open={dialog === "priority"}
        submitting={actionSubmitting}
        currentImpact={ticket.impact}
        currentUrgency={ticket.urgency}
        onClose={() => !actionSubmitting && setDialog(null)}
        onSubmit={(payload) => {
          const body: ChangePriorityPayload = payload;
          return runVerifiedAction(
            () => http.patch<Ticket>(`/api/tickets/${ticketId}/priority`, body),
            () => setDialog(null),
            "ticket.priority.success",
          );
        }}
      />

      <OverrideStatusDialog
        open={dialog === "override"}
        submitting={actionSubmitting}
        currentStatus={ticket.status}
        onClose={() => !actionSubmitting && setDialog(null)}
        onSubmit={(payload) => {
          const body: OverrideStatusPayload = payload;
          return runVerifiedAction(
            () => http.post<Ticket>(`/api/tickets/${ticketId}/override-status`, body),
            () => setDialog(null),
            "ticket.override.success",
          );
        }}
      />

      <ReassignDialog
        open={dialog === "reassign"}
        submitting={actionSubmitting}
        currentAssignee={ticket.assigneeId}
        onClose={() => !actionSubmitting && setDialog(null)}
        onSubmit={(payload) => {
          const body: ReassignPayload = payload;
          return runVerifiedAction(
            () => http.post<Ticket>(`/api/tickets/${ticketId}/reassign`, body),
            () => setDialog(null),
            "ticket.reassign.success",
          );
        }}
      />

      <ConfirmResumeDialog
        open={dialog === "confirmResume"}
        submitting={transitioning === "IN_PROGRESS"}
        onClose={() => setDialog(null)}
        onSubmit={() => {
          setDialog(null);
          return handlePlainTransition("IN_PROGRESS");
        }}
      />

      <ApproveDialog
        open={dialog === "approve"}
        submitting={actionSubmitting}
        onClose={() => !actionSubmitting && setDialog(null)}
        onSubmit={() =>
          runVerifiedAction(
            () => http.post<Ticket>(`/api/tickets/${ticketId}/approve`),
            () => setDialog(null),
            "approval.approve.success",
          )
        }
      />

      <RejectDialog
        open={dialog === "reject"}
        submitting={actionSubmitting}
        onClose={() => !actionSubmitting && setDialog(null)}
        onSubmit={(reason) =>
          runVerifiedAction(
            () => http.post<Ticket>(`/api/tickets/${ticketId}/reject`, { reason }),
            () => setDialog(null),
            "approval.reject.success",
          )
        }
      />
    </div>
  );
};

const AttachmentsPanel = ({
  attachments,
  allowedActions,
  uploading,
  onUpload,
  onDownload,
}: {
  attachments: Attachment[];
  allowedActions: Set<TicketAction>;
  uploading: boolean;
  onUpload: (file: File, visibility: Visibility) => void | Promise<void>;
  onDownload: (att: Attachment) => void | Promise<void>;
}) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [visibility, setVisibility] = useState<Visibility>("EXTERNAL");
  const canUpload = allowedActions.has("ADD_ATTACHMENT");
  const canPostInternal = allowedActions.has("ADD_WORKLOG"); // Agent/Manager proxy
  const externalAttachments = attachments.filter((a) => a.visibility === "EXTERNAL");
  const internalAttachments = attachments.filter((a) => a.visibility === "INTERNAL");

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void onUpload(file, visibility);
    e.target.value = "";
  };

  if (attachments.length === 0 && !canUpload) return null;

  return (
    <div className="side-section">
      <div className="side-section-header">
        <span style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-2)" }}>
          <IconPaperclip size={14} aria-hidden />
          {t("attachment.title")} ({attachments.length})
        </span>
      </div>
      <div className="side-section-body" style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        {externalAttachments.length > 0 && (
          <AttachmentList
            label={t("attachment.external")}
            items={externalAttachments}
            onDownload={onDownload}
          />
        )}
        {internalAttachments.length > 0 && (
          <AttachmentList
            label={t("attachment.internal")}
            items={internalAttachments}
            onDownload={onDownload}
          />
        )}

        {canUpload && (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", paddingTop: "var(--space-2)", borderTop: "1px solid var(--border)" }}>
            {canPostInternal && (
              <Select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as Visibility)}
                aria-label={t("attachment.visibility")}
                disabled={uploading}
              >
                <option value="EXTERNAL">{t("visibility.external")}</option>
                <option value="INTERNAL">{t("visibility.internal")}</option>
              </Select>
            )}
            <Button
              variant="default"
              size="sm"
              leadingIcon={<IconPaperclip size={14} />}
              onClick={() => fileInputRef.current?.click()}
              loading={uploading}
              disabled={uploading}
            >
              {t("attachment.upload")}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              onChange={onPick}
              style={{ display: "none" }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

const AttachmentList = ({
  label,
  items,
  onDownload,
}: {
  label: string;
  items: Attachment[];
  onDownload: (att: Attachment) => void | Promise<void>;
}) => (
  <div>
    <div style={{
      fontSize: "0.6875rem",
      fontWeight: "var(--weight-semibold)",
      color: "var(--text-muted)",
      letterSpacing: "0.06em",
      textTransform: "uppercase",
      marginBottom: "var(--space-1)",
    }}>{label}</div>
    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
      {items.map((a) => (
        <li
          key={a.id}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-2)",
            padding: "var(--space-2)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md)",
            background: "var(--bg-subtle)",
            fontSize: "var(--text-sm)",
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.fileName}</div>
            <div className="text-muted text-xs">{formatBytes(a.sizeBytes)} · {formatRelative(a.uploadedAt)}</div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            leadingIcon={<IconDownload size={14} />}
            onClick={() => void onDownload(a)}
            aria-label="Download"
          />
        </li>
      ))}
    </ul>
  </div>
);

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

const SideRow = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="side-row">
    <dt>{label}</dt>
    <dd>{children}</dd>
  </div>
);

const TimelineEntry = ({ event }: { event: TimelineEvent }) => {
  const { t } = useTranslation();

  if (event.eventType === "SYSTEM_EVENT") {
    return (
      <div className="timeline-entry" role="article">
        <div className="timeline-dot timeline-dot--system">
          <IconSettings size={14} aria-hidden />
        </div>
        <div className="timeline-content">
          <div className="timeline-meta">
            <span>{parseSystemPayload(event.payload, t)}</span>
            <span>·</span>
            <time dateTime={event.occurredAt}>{formatRelative(event.occurredAt)}</time>
          </div>
        </div>
      </div>
    );
  }

  const isWorklog = event.eventType === "WORKLOG";
  const isInternal = event.visibility === "INTERNAL";

  return (
    <div className="timeline-entry" role="article">
      <div className={`timeline-dot ${isWorklog ? "timeline-dot--worklog" : "timeline-dot--comment"}`}>
        {isWorklog ? <IconClock size={14} aria-hidden /> : <IconMessageSquare size={14} aria-hidden />}
      </div>
      <div className="timeline-content">
        <div className="timeline-meta">
          <Avatar name={formatActor(event.actorId)} size="sm" />
          <span className="timeline-actor">{formatActor(event.actorId)}</span>
          <span>·</span>
          <time dateTime={event.occurredAt}>{formatRelative(event.occurredAt)}</time>
          {isWorklog && <span className="badge badge--sm">{t("timeline.event.worklog")}</span>}
          {isInternal && <span className="badge badge--sm">{t("timeline.internal")}</span>}
        </div>
        {event.body && <div className="timeline-body-text">{event.body}</div>}
      </div>
    </div>
  );
};

const CommentComposer = ({
  ticketId,
  canPostInternal,
  onAdded
}: {
  ticketId: string;
  canPostInternal: boolean;
  onAdded: (event: TimelineEvent) => void;
}) => {
  const { t } = useTranslation();
  const toast = useToast();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [body, setBody] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("EXTERNAL");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!body.trim() || submitting) return;
    setSubmitting(true);
    try {
      const payload: AddCommentPayload = { body: body.trim(), visibility, parentId: null };
      const res = await http.post<TimelineEvent>(`/api/tickets/${ticketId}/comments`, payload);
      onAdded(res.data);
      setBody("");
      textareaRef.current?.focus();
    } catch {
      toast.error(t("error.comment_failed"));
    } finally {
      setSubmitting(false);
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      void submit(e as unknown as FormEvent);
    }
  };

  return (
    <form className="composer" onSubmit={(e) => void submit(e)}>
      <Field
        htmlFor="comment-body"
        label={t("ticket.add_comment")}
        hint={`${body.length} / ${COMMENT_MAX}`}
      >
        <Textarea
          id="comment-body"
          ref={textareaRef}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={t("ticket.comment.placeholder")}
          maxLength={COMMENT_MAX}
          rows={4}
        />
      </Field>
      <div className="composer-footer">
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
          {canPostInternal && (
            <Select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as Visibility)}
              aria-label={t("ticket.comment.visibility")}
              style={{ width: 180 }}
            >
              <option value="EXTERNAL">{t("visibility.external")}</option>
              <option value="INTERNAL">{t("visibility.internal")}</option>
            </Select>
          )}
          <span className="composer-tip">{t("ticket.comment.submit_hint")}</span>
        </div>
        <Button
          type="submit"
          variant="primary"
          loading={submitting}
          disabled={!body.trim()}
        >
          {t("ticket.comment.submit")}
        </Button>
      </div>
    </form>
  );
};

function parseSystemPayload(
  payload: string | null,
  t: (key: string, opts?: Record<string, string>) => string
): string {
  if (!payload) return t("timeline.event.system");
  try {
    const data = JSON.parse(payload) as Record<string, string>;
    if (data.event === "STATUS_CHANGED") {
      return t("timeline.status_changed", { from: data.from ?? "", to: data.to ?? "" });
    }
    if (data.event === "PRIORITY_CHANGED") {
      return t("timeline.priority_changed", { from: data.from ?? "", to: data.to ?? "" });
    }
    if (data.event === "TICKET_CREATED") {
      return t("timeline.ticket_created");
    }
    return data.event ?? t("timeline.event.system");
  } catch {
    return t("timeline.event.system");
  }
}
