import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { http } from "../api/http";
import { useRole } from "../auth/useRole";
import { SlaPanel } from "../components/ticket/SlaPanel";
import { ApproveDialog, ChangePriorityDialog, ConfirmCloseDialog, ConfirmResumeDialog, ForceCloseDialog, OverrideStatusDialog, ReassignDialog, RejectDialog, ResolveDialog, } from "../components/ticket/TicketActionDialogs";
import { Avatar } from "../components/ui/Avatar";
import { PriorityBadge, StatusBadge, TypeBadge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorBanner } from "../components/ui/ErrorBanner";
import { Field } from "../components/ui/Field";
import { IconAlertCircle, IconArrowLeft, IconArrowRight, IconCheckCircle, IconClock, IconDownload, IconMessageSquare, IconPaperclip, IconRefresh, IconSettings, IconUser, IconWrench } from "../components/ui/Icon";
import { Select, Textarea } from "../components/ui/Input";
import { LoadingState } from "../components/ui/Spinner";
import { useToast } from "../components/ui/Toast";
import { formatActor, formatDateTime, formatRelative } from "../lib/format";
import { PLAIN_STATUS_TRANSITIONS } from "../types/api";
const COMMENT_MAX = 10000;
const STATUS_KEY = {
    NEW: "status.new",
    IN_PROGRESS: "status.in_progress",
    WAITING_FOR_CUSTOMER: "status.waiting",
    RESOLVED: "status.resolved",
    CLOSED: "status.closed"
};
const STATUS_ICON = {
    NEW: _jsx(IconAlertCircle, { size: 14, "aria-hidden": true }),
    IN_PROGRESS: _jsx(IconWrench, { size: 14, "aria-hidden": true }),
    WAITING_FOR_CUSTOMER: _jsx(IconClock, { size: 14, "aria-hidden": true }),
    RESOLVED: _jsx(IconCheckCircle, { size: 14, "aria-hidden": true }),
    CLOSED: _jsx(IconCheckCircle, { size: 14, "aria-hidden": true })
};
export const TicketDetailPage = ({ ticketId, onBack }) => {
    const { t } = useTranslation();
    const { isCustomer, isAgent, isManager } = useRole();
    const toast = useToast();
    const [ticket, setTicket] = useState(null);
    const [timeline, setTimeline] = useState([]);
    const [attachments, setAttachments] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [transitioning, setTransitioning] = useState(null);
    const [dialog, setDialog] = useState(null);
    const [actionSubmitting, setActionSubmitting] = useState(false);
    const fetchAll = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [tk, tl, at] = await Promise.all([
                http.get(`/api/tickets/${ticketId}`),
                http.get(`/api/tickets/${ticketId}/timeline`),
                http.get(`/api/tickets/${ticketId}/attachments`)
            ]);
            setTicket(tk.data);
            setTimeline(tl.data);
            setAttachments(at.data);
        }
        catch {
            setError(t("error.fetch_failed"));
        }
        finally {
            setLoading(false);
        }
    }, [ticketId, t]);
    const refreshAttachments = useCallback(async () => {
        try {
            const res = await http.get(`/api/tickets/${ticketId}/attachments`);
            setAttachments(res.data);
        }
        catch { /* non-critical */ }
    }, [ticketId]);
    const uploadFile = async (file, visibility) => {
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
        }
        catch (err) {
            const axiosErr = err;
            toast.error(axiosErr?.response?.data?.message ?? t("attachment.upload_failed"));
        }
        finally {
            setUploading(false);
        }
    };
    const downloadAttachment = async (att) => {
        try {
            const res = await http.get(`/api/tickets/${ticketId}/attachments/${att.id}/download`, { responseType: "blob" });
            const blob = res.data;
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = att.fileName;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        }
        catch {
            toast.error(t("attachment.download_failed"));
        }
    };
    useEffect(() => {
        void fetchAll();
    }, [fetchAll]);
    const refreshTimeline = useCallback(async () => {
        try {
            const res = await http.get(`/api/tickets/${ticketId}/timeline`);
            setTimeline(res.data);
        }
        catch {
            /* non-critical */
        }
    }, [ticketId]);
    const handlePlainTransition = async (target) => {
        setTransitioning(target);
        try {
            const res = await http.patch(`/api/tickets/${ticketId}/status`, { status: target });
            setTicket(res.data);
            await refreshTimeline();
            toast.success(t("ticket.status.change"), t(STATUS_KEY[target]));
        }
        catch (err) {
            const axiosErr = err;
            toast.error(axiosErr?.response?.data?.message ?? t("error.transition_failed"));
        }
        finally {
            setTransitioning(null);
        }
    };
    const handleTakeOwnership = async () => {
        setActionSubmitting(true);
        try {
            const res = await http.post(`/api/tickets/${ticketId}/take-ownership`);
            setTicket(res.data);
            await refreshTimeline();
            toast.success(t("ticket.take_ownership.success"));
        }
        catch (err) {
            const axiosErr = err;
            toast.error(axiosErr?.response?.data?.message ?? t("error.action_failed"));
        }
        finally {
            setActionSubmitting(false);
        }
    };
    const runVerifiedAction = async (request, onSuccess, successKey, _input) => {
        setActionSubmitting(true);
        try {
            const res = await request();
            setTicket(res.data);
            await refreshTimeline();
            toast.success(t(successKey));
            onSuccess();
        }
        catch (err) {
            const axiosErr = err;
            toast.error(axiosErr?.response?.data?.message ?? t("error.action_failed"));
        }
        finally {
            setActionSubmitting(false);
        }
    };
    if (loading) {
        return (_jsx("div", { className: "page-container", children: _jsx("div", { className: "card", children: _jsx(LoadingState, { text: t("app.loading") }) }) }));
    }
    if (error || !ticket) {
        return (_jsxs("div", { className: "page-container", children: [_jsx("nav", { className: "breadcrumb", "aria-label": t("nav.breadcrumb"), children: _jsx("button", { type: "button", onClick: onBack, children: t("nav.tickets") }) }), _jsx(ErrorBanner, { children: error ?? t("error.fetch_failed") }), _jsx("div", { style: { marginTop: "var(--space-3)" }, children: _jsx(Button, { variant: "ghost", leadingIcon: _jsx(IconArrowLeft, {}), onClick: onBack, children: t("error.back_to_list") }) })] }));
    }
    const allowedActions = new Set(ticket.allowedActions);
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
    const hasAny = (...actions) => actions.some((a) => allowedActions.has(a));
    const canPostInternal = !isCustomer();
    return (_jsxs("div", { className: "page-container", children: [_jsxs("nav", { className: "breadcrumb", "aria-label": t("nav.breadcrumb"), children: [_jsx("button", { type: "button", onClick: onBack, children: t("nav.tickets") }), _jsx("span", { className: "breadcrumb-sep", "aria-hidden": "true", children: "/" }), _jsxs("span", { className: "breadcrumb-current", children: ["#", ticket.id.slice(0, 8)] })] }), _jsxs("div", { className: "detail-grid", children: [_jsxs("div", { className: "detail-main", children: [_jsxs("header", { className: "detail-header", children: [_jsxs("div", { className: "detail-header-meta", children: [_jsx(TypeBadge, { type: ticket.type }), _jsx("span", { children: "\u00B7" }), _jsxs("span", { style: { fontFamily: "var(--font-mono)" }, children: ["#", ticket.id.slice(0, 8)] }), _jsx("span", { children: "\u00B7" }), _jsxs("span", { children: [t("ticket.meta.updated"), " ", formatRelative(ticket.updatedAt)] })] }), _jsx("h1", { className: "detail-title", children: ticket.title }), _jsxs("div", { style: { display: "flex", alignItems: "center", gap: "var(--space-2)", marginTop: "var(--space-3)" }, children: [_jsx(StatusBadge, { status: ticket.status }), !isCustomer() && _jsx(PriorityBadge, { priority: ticket.priority })] }), ticket.description && (_jsx("p", { className: "detail-description", children: ticket.description })), ticket.resolutionNote && (_jsxs("div", { className: "resolution-block", style: {
                                            marginTop: "var(--space-4)",
                                            padding: "var(--space-3) var(--space-4)",
                                            border: "1px solid var(--border)",
                                            borderLeft: "3px solid var(--color-success, #22c55e)",
                                            borderRadius: "var(--radius-md)",
                                            background: "var(--bg-subtle)",
                                        }, children: [_jsx("div", { style: { fontSize: "var(--text-xs)", color: "var(--text-muted)", marginBottom: "var(--space-1)", fontWeight: "var(--weight-semibold)", letterSpacing: "0.04em", textTransform: "uppercase" }, children: t("ticket.resolution_note") }), _jsx("div", { style: { fontSize: "var(--text-sm)", color: "var(--text)", whiteSpace: "pre-wrap" }, children: ticket.resolutionNote })] })), ticket.closeReason && ticket.status === "CLOSED" && (_jsxs("div", { className: "close-block", style: {
                                            marginTop: "var(--space-3)",
                                            padding: "var(--space-3) var(--space-4)",
                                            border: "1px solid var(--border)",
                                            borderLeft: "3px solid var(--text-muted)",
                                            borderRadius: "var(--radius-md)",
                                            background: "var(--bg-subtle)",
                                        }, children: [_jsx("div", { style: { fontSize: "var(--text-xs)", color: "var(--text-muted)", marginBottom: "var(--space-1)", fontWeight: "var(--weight-semibold)", letterSpacing: "0.04em", textTransform: "uppercase" }, children: t("ticket.close_reason") }), _jsx("div", { style: { fontSize: "var(--text-sm)", color: "var(--text)", whiteSpace: "pre-wrap" }, children: ticket.closeReason })] }))] }), _jsxs("section", { className: "timeline", "aria-label": t("ticket.timeline"), children: [_jsxs("div", { className: "timeline-header", children: [_jsxs("div", { style: { display: "flex", alignItems: "center", gap: "var(--space-2)" }, children: [_jsx(IconMessageSquare, { size: 16, "aria-hidden": true }), _jsx("strong", { style: { fontSize: "var(--text-sm)" }, children: t("ticket.timeline") }), _jsxs("span", { className: "text-muted text-xs", children: ["(", timeline.length, ")"] })] }), _jsx(Button, { variant: "ghost", size: "sm", leadingIcon: _jsx(IconRefresh, {}), onClick: () => void refreshTimeline(), children: t("action.refresh") })] }), _jsx("div", { className: "timeline-body", children: timeline.length === 0 ? (_jsx("div", { className: "timeline-empty", children: _jsx(EmptyState, { icon: _jsx(IconMessageSquare, { size: 20 }), title: t("ticket.timeline.empty") }) })) : (timeline.map((event) => _jsx(TimelineEntry, { event: event }, event.id))) })] }), ticket.status !== "CLOSED" && allowedActions.has("ADD_COMMENT") && (_jsx(CommentComposer, { ticketId: ticketId, canPostInternal: canPostInternal, onAdded: (event) => setTimeline((prev) => [...prev, event]) }))] }), _jsxs("aside", { className: "detail-side", children: [ticket.sla && _jsx(SlaPanel, { sla: ticket.sla }), (plainTransitions.length > 0 ||
                                hasAny("TAKE_OWNERSHIP", "RESOLVE", "CONFIRM_CLOSE", "FORCE_CLOSE", "CHANGE_PRIORITY", "REASSIGN", "OVERRIDE_STATUS", "APPROVE_REQUEST", "REJECT_REQUEST", "REQUEST_INFO", "REOPEN_REQUEST")) && (_jsxs("div", { className: "side-section", children: [_jsx("div", { className: "side-section-header", children: t("ticket.actions") }), _jsx("div", { className: "side-section-body", children: _jsxs("div", { className: "status-actions", children: [allowedActions.has("TAKE_OWNERSHIP") && (_jsx(Button, { variant: "primary", size: "sm", leadingIcon: _jsx(IconUser, { size: 14, "aria-hidden": true }), onClick: () => void handleTakeOwnership(), loading: actionSubmitting, disabled: transitioning !== null, children: t("ticket.take_ownership.action") })), allowedActions.has("REQUEST_INFO") && (_jsx(Button, { variant: "primary", size: "sm", leadingIcon: _jsx(IconArrowRight, { size: 14, "aria-hidden": true }), onClick: () => setDialog("confirmResume"), disabled: transitioning !== null || actionSubmitting, children: t("ticket.request_info.action") })), allowedActions.has("REOPEN_REQUEST") && (_jsx(Button, { variant: "default", size: "sm", leadingIcon: _jsx(IconRefresh, { size: 14, "aria-hidden": true }), onClick: () => void handlePlainTransition("IN_PROGRESS"), loading: transitioning === "IN_PROGRESS", disabled: transitioning !== null || actionSubmitting, children: t("ticket.reopen.action") })), plainTransitions.map((target) => (_jsx(Button, { variant: "default", size: "sm", leadingIcon: STATUS_ICON[target], trailingIcon: _jsx(IconArrowRight, {}), onClick: () => void handlePlainTransition(target), loading: transitioning === target, disabled: transitioning !== null, children: t(STATUS_KEY[target]) }, target))), allowedActions.has("RESOLVE") && (_jsx(Button, { variant: "primary", size: "sm", leadingIcon: _jsx(IconCheckCircle, { size: 14, "aria-hidden": true }), onClick: () => setDialog("resolve"), disabled: actionSubmitting || transitioning !== null, children: t("ticket.resolve.action") })), allowedActions.has("CONFIRM_CLOSE") && (_jsx(Button, { variant: "primary", size: "sm", leadingIcon: _jsx(IconCheckCircle, { size: 14, "aria-hidden": true }), onClick: () => setDialog("confirmClose"), disabled: actionSubmitting, children: t("ticket.confirm_close.action") })), allowedActions.has("REASSIGN") && (_jsx(Button, { variant: "default", size: "sm", leadingIcon: _jsx(IconUser, { size: 14, "aria-hidden": true }), onClick: () => setDialog("reassign"), disabled: actionSubmitting, children: t("ticket.reassign.action") })), allowedActions.has("OVERRIDE_STATUS") && (_jsx(Button, { variant: "default", size: "sm", leadingIcon: _jsx(IconAlertCircle, { size: 14, "aria-hidden": true }), onClick: () => setDialog("override"), disabled: actionSubmitting, children: t("ticket.override.action") })), allowedActions.has("FORCE_CLOSE") && (_jsx(Button, { variant: "danger", size: "sm", leadingIcon: _jsx(IconAlertCircle, { size: 14, "aria-hidden": true }), onClick: () => setDialog("forceClose"), disabled: actionSubmitting, children: t("ticket.force_close.action") })), allowedActions.has("APPROVE_REQUEST") && (_jsx(Button, { variant: "primary", size: "sm", leadingIcon: _jsx(IconCheckCircle, { size: 14, "aria-hidden": true }), onClick: () => setDialog("approve"), disabled: actionSubmitting, children: t("approval.approve.action") })), allowedActions.has("REJECT_REQUEST") && (_jsx(Button, { variant: "danger", size: "sm", leadingIcon: _jsx(IconAlertCircle, { size: 14, "aria-hidden": true }), onClick: () => setDialog("reject"), disabled: actionSubmitting, children: t("approval.reject.action") })), allowedActions.has("CHANGE_PRIORITY") && (_jsx(Button, { variant: "ghost", size: "sm", leadingIcon: _jsx(IconSettings, { size: 14, "aria-hidden": true }), onClick: () => setDialog("priority"), disabled: actionSubmitting, children: t("ticket.priority.action") }))] }) })] })), _jsx(AttachmentsPanel, { attachments: attachments, allowedActions: allowedActions, uploading: uploading, onUpload: uploadFile, onDownload: downloadAttachment }), _jsxs("div", { className: "side-section", children: [_jsx("div", { className: "side-section-header", children: t("ticket.details") }), _jsx("div", { className: "side-section-body", children: _jsxs("dl", { style: { display: "flex", flexDirection: "column", gap: "var(--space-3)" }, children: [_jsx(SideRow, { label: t("ticket.col.status"), children: _jsx(StatusBadge, { status: ticket.status }) }), _jsx(SideRow, { label: t("ticket.col.type"), children: _jsx(TypeBadge, { type: ticket.type }) }), _jsx(SideRow, { label: t("ticket.col.assignee"), children: ticket.assigneeId ? (_jsxs("span", { className: "text-sm", style: { display: "inline-flex", alignItems: "center", gap: "var(--space-2)" }, children: [_jsx(Avatar, { name: formatActor(ticket.assigneeId), size: "sm" }), formatActor(ticket.assigneeId)] })) : (_jsx("span", { className: "text-muted text-sm", children: t("ticket.assignee.unassigned") })) }), !isCustomer() && (_jsxs(_Fragment, { children: [_jsx(SideRow, { label: t("ticket.col.priority"), children: _jsx(PriorityBadge, { priority: ticket.priority }) }), _jsx(SideRow, { label: t("ticket.col.impact"), children: _jsx("span", { className: "text-sm", children: t(`impact.${ticket.impact.toLowerCase()}`) }) }), _jsx(SideRow, { label: t("ticket.col.urgency"), children: _jsx("span", { className: "text-sm", children: t(`urgency.${ticket.urgency.toLowerCase()}`) }) })] })), ticket.approvalState && (_jsx(SideRow, { label: t("ticket.col.approval"), children: _jsx("span", { className: "text-sm", children: t(`approval.${ticket.approvalState.toLowerCase()}`) }) })), _jsx(SideRow, { label: t("ticket.meta.created"), children: _jsx("time", { dateTime: ticket.createdAt, className: "text-sm", children: formatDateTime(ticket.createdAt) }) }), _jsx(SideRow, { label: t("ticket.meta.updated"), children: _jsx("time", { dateTime: ticket.updatedAt, className: "text-sm", children: formatDateTime(ticket.updatedAt) }) }), ticket.resolvedAt && (_jsx(SideRow, { label: t("ticket.meta.resolved"), children: _jsx("time", { dateTime: ticket.resolvedAt, className: "text-sm", children: formatDateTime(ticket.resolvedAt) }) })), ticket.closedAt && (_jsx(SideRow, { label: t("ticket.meta.closed"), children: _jsx("time", { dateTime: ticket.closedAt, className: "text-sm", children: formatDateTime(ticket.closedAt) }) })), _jsx(SideRow, { label: t("ticket.meta.id"), children: _jsx("code", { style: { fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)", color: "var(--text-secondary)" }, children: ticket.id }) })] }) })] })] })] }), _jsx(ResolveDialog, { open: dialog === "resolve", submitting: actionSubmitting, onClose: () => !actionSubmitting && setDialog(null), onSubmit: (resolutionNote, resolutionCode) => {
                    const payload = { resolutionNote, resolutionCode };
                    return runVerifiedAction(() => http.post(`/api/tickets/${ticketId}/resolve`, payload), () => setDialog(null), "ticket.resolve.success");
                } }), _jsx(ConfirmCloseDialog, { open: dialog === "confirmClose", submitting: actionSubmitting, onClose: () => !actionSubmitting && setDialog(null), onSubmit: () => runVerifiedAction(() => http.post(`/api/tickets/${ticketId}/confirm-close`), () => setDialog(null), "ticket.confirm_close.success") }), _jsx(ForceCloseDialog, { open: dialog === "forceClose", submitting: actionSubmitting, onClose: () => !actionSubmitting && setDialog(null), onSubmit: (reason) => {
                    const payload = { reason };
                    return runVerifiedAction(() => http.post(`/api/tickets/${ticketId}/force-close`, payload), () => setDialog(null), "ticket.force_close.success");
                } }), _jsx(ChangePriorityDialog, { open: dialog === "priority", submitting: actionSubmitting, currentImpact: ticket.impact, currentUrgency: ticket.urgency, onClose: () => !actionSubmitting && setDialog(null), onSubmit: (payload) => {
                    const body = payload;
                    return runVerifiedAction(() => http.patch(`/api/tickets/${ticketId}/priority`, body), () => setDialog(null), "ticket.priority.success");
                } }), _jsx(OverrideStatusDialog, { open: dialog === "override", submitting: actionSubmitting, currentStatus: ticket.status, onClose: () => !actionSubmitting && setDialog(null), onSubmit: (payload) => {
                    const body = payload;
                    return runVerifiedAction(() => http.post(`/api/tickets/${ticketId}/override-status`, body), () => setDialog(null), "ticket.override.success");
                } }), _jsx(ReassignDialog, { open: dialog === "reassign", submitting: actionSubmitting, currentAssignee: ticket.assigneeId, onClose: () => !actionSubmitting && setDialog(null), onSubmit: (payload) => {
                    const body = payload;
                    return runVerifiedAction(() => http.post(`/api/tickets/${ticketId}/reassign`, body), () => setDialog(null), "ticket.reassign.success");
                } }), _jsx(ConfirmResumeDialog, { open: dialog === "confirmResume", submitting: transitioning === "IN_PROGRESS", onClose: () => setDialog(null), onSubmit: () => {
                    setDialog(null);
                    return handlePlainTransition("IN_PROGRESS");
                } }), _jsx(ApproveDialog, { open: dialog === "approve", submitting: actionSubmitting, onClose: () => !actionSubmitting && setDialog(null), onSubmit: () => runVerifiedAction(() => http.post(`/api/tickets/${ticketId}/approve`), () => setDialog(null), "approval.approve.success") }), _jsx(RejectDialog, { open: dialog === "reject", submitting: actionSubmitting, onClose: () => !actionSubmitting && setDialog(null), onSubmit: (reason) => runVerifiedAction(() => http.post(`/api/tickets/${ticketId}/reject`, { reason }), () => setDialog(null), "approval.reject.success") })] }));
};
const AttachmentsPanel = ({ attachments, allowedActions, uploading, onUpload, onDownload, }) => {
    const { t } = useTranslation();
    const fileInputRef = useRef(null);
    const [visibility, setVisibility] = useState("EXTERNAL");
    const canUpload = allowedActions.has("ADD_ATTACHMENT");
    const canPostInternal = allowedActions.has("ADD_WORKLOG"); // Agent/Manager proxy
    const externalAttachments = attachments.filter((a) => a.visibility === "EXTERNAL");
    const internalAttachments = attachments.filter((a) => a.visibility === "INTERNAL");
    const onPick = (e) => {
        const file = e.target.files?.[0];
        if (file)
            void onUpload(file, visibility);
        e.target.value = "";
    };
    if (attachments.length === 0 && !canUpload)
        return null;
    return (_jsxs("div", { className: "side-section", children: [_jsx("div", { className: "side-section-header", children: _jsxs("span", { style: { display: "inline-flex", alignItems: "center", gap: "var(--space-2)" }, children: [_jsx(IconPaperclip, { size: 14, "aria-hidden": true }), t("attachment.title"), " (", attachments.length, ")"] }) }), _jsxs("div", { className: "side-section-body", style: { display: "flex", flexDirection: "column", gap: "var(--space-3)" }, children: [externalAttachments.length > 0 && (_jsx(AttachmentList, { label: t("attachment.external"), items: externalAttachments, onDownload: onDownload })), internalAttachments.length > 0 && (_jsx(AttachmentList, { label: t("attachment.internal"), items: internalAttachments, onDownload: onDownload })), canUpload && (_jsxs("div", { style: { display: "flex", flexDirection: "column", gap: "var(--space-2)", paddingTop: "var(--space-2)", borderTop: "1px solid var(--border)" }, children: [canPostInternal && (_jsxs(Select, { value: visibility, onChange: (e) => setVisibility(e.target.value), "aria-label": t("attachment.visibility"), disabled: uploading, children: [_jsx("option", { value: "EXTERNAL", children: t("visibility.external") }), _jsx("option", { value: "INTERNAL", children: t("visibility.internal") })] })), _jsx(Button, { variant: "default", size: "sm", leadingIcon: _jsx(IconPaperclip, { size: 14 }), onClick: () => fileInputRef.current?.click(), loading: uploading, disabled: uploading, children: t("attachment.upload") }), _jsx("input", { ref: fileInputRef, type: "file", onChange: onPick, style: { display: "none" } })] }))] })] }));
};
const AttachmentList = ({ label, items, onDownload, }) => (_jsxs("div", { children: [_jsx("div", { style: {
                fontSize: "0.6875rem",
                fontWeight: "var(--weight-semibold)",
                color: "var(--text-muted)",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                marginBottom: "var(--space-1)",
            }, children: label }), _jsx("ul", { style: { listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "var(--space-1)" }, children: items.map((a) => (_jsxs("li", { style: {
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--space-2)",
                    padding: "var(--space-2)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-md)",
                    background: "var(--bg-subtle)",
                    fontSize: "var(--text-sm)",
                }, children: [_jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [_jsx("div", { style: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: a.fileName }), _jsxs("div", { className: "text-muted text-xs", children: [formatBytes(a.sizeBytes), " \u00B7 ", formatRelative(a.uploadedAt)] })] }), _jsx(Button, { variant: "ghost", size: "sm", iconOnly: true, leadingIcon: _jsx(IconDownload, { size: 14 }), onClick: () => void onDownload(a), "aria-label": "Download" })] }, a.id))) })] }));
function formatBytes(bytes) {
    if (bytes < 1024)
        return `${bytes} B`;
    if (bytes < 1024 * 1024)
        return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
const SideRow = ({ label, children }) => (_jsxs("div", { className: "side-row", children: [_jsx("dt", { children: label }), _jsx("dd", { children: children })] }));
const TimelineEntry = ({ event }) => {
    const { t } = useTranslation();
    if (event.eventType === "SYSTEM_EVENT") {
        return (_jsxs("div", { className: "timeline-entry", role: "article", children: [_jsx("div", { className: "timeline-dot timeline-dot--system", children: _jsx(IconSettings, { size: 14, "aria-hidden": true }) }), _jsx("div", { className: "timeline-content", children: _jsxs("div", { className: "timeline-meta", children: [_jsx("span", { children: parseSystemPayload(event.payload, t) }), _jsx("span", { children: "\u00B7" }), _jsx("time", { dateTime: event.occurredAt, children: formatRelative(event.occurredAt) })] }) })] }));
    }
    const isWorklog = event.eventType === "WORKLOG";
    const isInternal = event.visibility === "INTERNAL";
    return (_jsxs("div", { className: "timeline-entry", role: "article", children: [_jsx("div", { className: `timeline-dot ${isWorklog ? "timeline-dot--worklog" : "timeline-dot--comment"}`, children: isWorklog ? _jsx(IconClock, { size: 14, "aria-hidden": true }) : _jsx(IconMessageSquare, { size: 14, "aria-hidden": true }) }), _jsxs("div", { className: "timeline-content", children: [_jsxs("div", { className: "timeline-meta", children: [_jsx(Avatar, { name: formatActor(event.actorId), size: "sm" }), _jsx("span", { className: "timeline-actor", children: formatActor(event.actorId) }), _jsx("span", { children: "\u00B7" }), _jsx("time", { dateTime: event.occurredAt, children: formatRelative(event.occurredAt) }), isWorklog && _jsx("span", { className: "badge badge--sm", children: t("timeline.event.worklog") }), isInternal && _jsx("span", { className: "badge badge--sm", children: t("timeline.internal") })] }), event.body && _jsx("div", { className: "timeline-body-text", children: event.body })] })] }));
};
const CommentComposer = ({ ticketId, canPostInternal, onAdded }) => {
    const { t } = useTranslation();
    const toast = useToast();
    const textareaRef = useRef(null);
    const [body, setBody] = useState("");
    const [visibility, setVisibility] = useState("EXTERNAL");
    const [submitting, setSubmitting] = useState(false);
    const submit = async (e) => {
        e.preventDefault();
        if (!body.trim() || submitting)
            return;
        setSubmitting(true);
        try {
            const payload = { body: body.trim(), visibility, parentId: null };
            const res = await http.post(`/api/tickets/${ticketId}/comments`, payload);
            onAdded(res.data);
            setBody("");
            textareaRef.current?.focus();
        }
        catch {
            toast.error(t("error.comment_failed"));
        }
        finally {
            setSubmitting(false);
        }
    };
    const onKeyDown = (e) => {
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
            void submit(e);
        }
    };
    return (_jsxs("form", { className: "composer", onSubmit: (e) => void submit(e), children: [_jsx(Field, { htmlFor: "comment-body", label: t("ticket.add_comment"), hint: `${body.length} / ${COMMENT_MAX}`, children: _jsx(Textarea, { id: "comment-body", ref: textareaRef, value: body, onChange: (e) => setBody(e.target.value), onKeyDown: onKeyDown, placeholder: t("ticket.comment.placeholder"), maxLength: COMMENT_MAX, rows: 4 }) }), _jsxs("div", { className: "composer-footer", children: [_jsxs("div", { style: { display: "flex", alignItems: "center", gap: "var(--space-3)" }, children: [canPostInternal && (_jsxs(Select, { value: visibility, onChange: (e) => setVisibility(e.target.value), "aria-label": t("ticket.comment.visibility"), style: { width: 180 }, children: [_jsx("option", { value: "EXTERNAL", children: t("visibility.external") }), _jsx("option", { value: "INTERNAL", children: t("visibility.internal") })] })), _jsx("span", { className: "composer-tip", children: t("ticket.comment.submit_hint") })] }), _jsx(Button, { type: "submit", variant: "primary", loading: submitting, disabled: !body.trim(), children: t("ticket.comment.submit") })] })] }));
};
function parseSystemPayload(payload, t) {
    if (!payload)
        return t("timeline.event.system");
    try {
        const data = JSON.parse(payload);
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
    }
    catch {
        return t("timeline.event.system");
    }
}
