import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useEffect, useRef, useState } from "react";
import { http } from "../api/http";
import { useRole } from "../auth/useRole";
import { ApproveDialog, ChangePriorityDialog, ConfirmCloseDialog, ConfirmResumeDialog, ForceCloseDialog, OverrideStatusDialog, ReassignDialog, RejectDialog, ResolveDialog } from "../components/ticket/TicketActionDialogs";
import { Card, EmptyState, ErrorBanner, WarnBanner } from "../components/itsm/Common";
import { Icon } from "../components/itsm/Icon";
import { Assignee, Avatar, PriorityPill, SLABar, StatusBadge, Stars, TypeBadge, VisibilityPill } from "../components/itsm/Primitives";
import { SLA_LEVEL_META, STATUS_META } from "../components/itsm/meta";
import { Dialog } from "../components/ui/Dialog";
import { Button } from "../components/ui/Button";
import { Textarea } from "../components/ui/Input";
import { useToast } from "../components/ui/Toast";
import { formatActor, formatDateTime, formatRelative } from "../lib/format";
import { PLAIN_STATUS_TRANSITIONS } from "../types/api";
const COMMENT_MAX = 10000;
export const TicketDetailPage = ({ ticketId, onBack }) => {
    const { isCustomer, isAgent, isManager } = useRole();
    const toast = useToast();
    const [ticket, setTicket] = useState(null);
    const [timeline, setTimeline] = useState([]);
    const [attachments, setAttachments] = useState([]);
    const [feedback, setFeedback] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [transitioning, setTransitioning] = useState(null);
    const [dialog, setDialog] = useState(null);
    const [actionSubmitting, setActionSubmitting] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [tab, setTab] = useState("timeline");
    const fetchAll = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [tk, tl, at] = await Promise.all([
                http.get(`/api/v1/tickets/${ticketId}`),
                http.get(`/api/v1/tickets/${ticketId}/timeline`),
                http.get(`/api/v1/tickets/${ticketId}/attachments`)
            ]);
            setTicket(tk.data);
            setTimeline(tl.data);
            setAttachments(at.data);
            if (tk.data.status === "CLOSED") {
                try {
                    const fb = await http.get(`/api/v1/tickets/${ticketId}/feedback`);
                    setFeedback(fb.status === 204 ? null : fb.data);
                }
                catch {
                    setFeedback(null);
                }
            }
            else {
                setFeedback(null);
            }
        }
        catch {
            setError("Talep yüklenemedi.");
        }
        finally {
            setLoading(false);
        }
    }, [ticketId]);
    const refreshTimeline = useCallback(async () => {
        try {
            const res = await http.get(`/api/v1/tickets/${ticketId}/timeline`);
            setTimeline(res.data);
        }
        catch { /* ignore */ }
    }, [ticketId]);
    const refreshAttachments = useCallback(async () => {
        try {
            const res = await http.get(`/api/v1/tickets/${ticketId}/attachments`);
            setAttachments(res.data);
        }
        catch { /* ignore */ }
    }, [ticketId]);
    useEffect(() => { void fetchAll(); }, [fetchAll]);
    const handlePlainTransition = async (target) => {
        setTransitioning(target);
        try {
            const res = await http.patch(`/api/v1/tickets/${ticketId}/status`, { status: target });
            setTicket(res.data);
            await refreshTimeline();
            toast.success("Durum değiştirildi", STATUS_META[target].label);
        }
        catch (err) {
            toast.error(err?.response?.data?.message ?? "Durum değiştirilemedi");
        }
        finally {
            setTransitioning(null);
        }
    };
    const handleTakeOwnership = async () => {
        setActionSubmitting(true);
        try {
            const res = await http.post(`/api/v1/tickets/${ticketId}/take-ownership`);
            setTicket(res.data);
            await refreshTimeline();
            toast.success("Talep sahiplenildi");
        }
        catch (err) {
            toast.error(err?.response?.data?.message ?? "İşlem başarısız");
        }
        finally {
            setActionSubmitting(false);
        }
    };
    const runAction = async (req, onOk, msg) => {
        setActionSubmitting(true);
        try {
            const res = await req();
            setTicket(res.data);
            await refreshTimeline();
            toast.success(msg);
            onOk();
        }
        catch (err) {
            toast.error(err?.response?.data?.message ?? "İşlem başarısız");
        }
        finally {
            setActionSubmitting(false);
        }
    };
    const uploadFile = async (file, visibility) => {
        setUploading(true);
        try {
            const fd = new FormData();
            fd.append("file", file);
            fd.append("visibility", visibility);
            await http.post(`/api/v1/tickets/${ticketId}/attachments/upload`, fd, { headers: { "Content-Type": "multipart/form-data" } });
            await refreshAttachments();
            await refreshTimeline();
            toast.success("Ek yüklendi");
        }
        catch (err) {
            toast.error(err?.response?.data?.message ?? "Yükleme başarısız");
        }
        finally {
            setUploading(false);
        }
    };
    const downloadAttachment = async (att) => {
        try {
            const res = await http.get(`/api/v1/tickets/${ticketId}/attachments/${att.id}/download`, { responseType: "blob" });
            const url = URL.createObjectURL(res.data);
            const a = document.createElement("a");
            a.href = url;
            a.download = att.fileName;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        }
        catch {
            toast.error("İndirme başarısız");
        }
    };
    if (loading) {
        return _jsx("div", { className: "col gap-4", children: _jsx("div", { className: "sk", style: { height: 200, borderRadius: 8 } }) });
    }
    if (error || !ticket) {
        return (_jsxs("div", { className: "col gap-4", children: [_jsx(ErrorBanner, { msg: error ?? "Talep bulunamadı.", onRetry: () => void fetchAll() }), _jsx("div", { children: _jsxs("button", { className: "btn", onClick: onBack, children: [_jsx(Icon, { name: "chevright", size: 13, style: { transform: "rotate(180deg)" } }), "Listeye d\u00F6n"] }) })] }));
    }
    const allowedActions = new Set(ticket.allowedActions);
    const canRunPlain = isAgent() || isManager();
    const plainTransitions = canRunPlain
        ? PLAIN_STATUS_TRANSITIONS[ticket.status].filter((target) => {
            if (target === "IN_PROGRESS" && ticket.type === "SERVICE_REQUEST" && ticket.approvalState === "PENDING")
                return false;
            return true;
        })
        : [];
    const visibleTimeline = isCustomer() ? timeline.filter((e) => e.visibility !== "INTERNAL") : timeline;
    return (_jsxs("div", { className: "col gap-4", children: [_jsxs("div", { children: [_jsxs("div", { className: "row", style: { gap: 8, marginBottom: 8 }, children: [_jsx("span", { className: "crumb faint", style: { fontSize: "var(--fs-cap)", cursor: "pointer" }, onClick: onBack, children: "Talepler /" }), _jsxs("span", { className: "mono", style: { fontSize: "var(--fs-cap)", color: "var(--text-tertiary)" }, children: ["#", ticket.id.slice(0, 8)] })] }), _jsxs("div", { className: "row", style: { gap: 12, alignItems: "flex-start" }, children: [_jsxs("div", { className: "col", style: { flex: 1, gap: 9 }, children: [_jsx("h1", { style: { margin: 0, fontSize: 22, fontWeight: 650, letterSpacing: "-.3px", lineHeight: 1.25 }, children: ticket.title }), _jsxs("div", { className: "row", style: { gap: 8, flexWrap: "wrap" }, children: [_jsx(StatusBadge, { status: ticket.status }), _jsx(TypeBadge, { type: ticket.type }), !isCustomer() && _jsx(PriorityPill, { priority: ticket.priority }), _jsxs("span", { className: "faint", style: { fontSize: "var(--fs-cap)" }, children: ["\u00B7 g\u00FCncellendi ", formatRelative(ticket.updatedAt)] })] })] }), _jsxs("div", { className: "row", style: { gap: 8, flexWrap: "wrap" }, children: [allowedActions.has("TAKE_OWNERSHIP") && (_jsxs("button", { className: "btn btn-primary", onClick: () => void handleTakeOwnership(), disabled: actionSubmitting, children: [_jsx(Icon, { name: "user", size: 13 }), "Sahiplen"] })), allowedActions.has("RESOLVE") && (_jsxs("button", { className: "btn btn-primary", onClick: () => setDialog("resolve"), disabled: actionSubmitting, children: [_jsx(Icon, { name: "check", size: 13 }), "\u00C7\u00F6z"] })), allowedActions.has("CONFIRM_CLOSE") && (_jsxs("button", { className: "btn btn-primary", onClick: () => setDialog("confirmClose"), disabled: actionSubmitting, children: [_jsx(Icon, { name: "check", size: 13 }), "Onayla & Kapat"] })), allowedActions.has("REASSIGN") && (_jsxs("button", { className: "btn", onClick: () => setDialog("reassign"), disabled: actionSubmitting, children: [_jsx(Icon, { name: "users", size: 13 }), "Yeniden Ata"] })), allowedActions.has("OVERRIDE_STATUS") && (_jsxs("button", { className: "btn", onClick: () => setDialog("override"), disabled: actionSubmitting, children: [_jsx(Icon, { name: "shield", size: 13 }), "M\u00FCdahale"] })), allowedActions.has("FORCE_CLOSE") && (_jsxs("button", { className: "btn btn-danger", onClick: () => setDialog("forceClose"), disabled: actionSubmitting, children: [_jsx(Icon, { name: "lock", size: 13 }), "Zorla Kapat"] })), allowedActions.has("APPROVE_REQUEST") && (_jsxs("button", { className: "btn btn-primary", onClick: () => setDialog("approve"), disabled: actionSubmitting, children: [_jsx(Icon, { name: "check", size: 13 }), "Onayla"] })), allowedActions.has("REJECT_REQUEST") && (_jsxs("button", { className: "btn btn-danger", onClick: () => setDialog("reject"), disabled: actionSubmitting, children: [_jsx(Icon, { name: "x", size: 13 }), "Reddet"] })), allowedActions.has("CHANGE_PRIORITY") && (_jsxs("button", { className: "btn", onClick: () => setDialog("priority"), disabled: actionSubmitting, children: [_jsx(Icon, { name: "settings", size: 13 }), "\u00D6ncelik"] })), allowedActions.has("REQUEST_INFO") && isCustomer() && (_jsxs("button", { className: "btn btn-primary", onClick: () => setDialog("confirmResume"), disabled: transitioning !== null || actionSubmitting, children: [_jsx(Icon, { name: "check", size: 13 }), "Yan\u0131tlad\u0131m \u2014 Devam Et"] })), allowedActions.has("REOPEN_REQUEST") && (_jsxs("button", { className: "btn", onClick: () => void handlePlainTransition("IN_PROGRESS"), disabled: transitioning !== null, children: [_jsx(Icon, { name: "reopen", size: 13 }), "Yeniden A\u00E7"] })), plainTransitions.map((target) => (_jsxs("button", { className: "btn", onClick: () => void handlePlainTransition(target), disabled: transitioning !== null, children: [_jsx(Icon, { name: "chevright", size: 13 }), STATUS_META[target].label] }, target))), isCustomer() && ticket.status !== "CLOSED" && (_jsxs("button", { className: "btn btn-danger", onClick: () => setDialog("complaint"), disabled: actionSubmitting, children: [_jsx(Icon, { name: "thumbsdown", size: 13 }), "\u015Eikayet"] })), isCustomer() && ticket.status === "CLOSED" && !feedback && (_jsxs("button", { className: "btn btn-primary", onClick: () => setDialog("feedback"), disabled: actionSubmitting, children: [_jsx(Icon, { name: "star", size: 13 }), "De\u011Ferlendir"] }))] })] })] }), _jsxs("div", { className: "grid", style: { gridTemplateColumns: "minmax(0, 1fr) 320px", gap: 18, alignItems: "start" }, children: [_jsxs("div", { className: "col", style: { gap: 14 }, children: [ticket.description && (_jsx(Card, { title: "A\u00E7\u0131klama", children: _jsx("p", { style: { margin: 0, whiteSpace: "pre-wrap", fontSize: "var(--fs-body)", color: "var(--text-secondary)", lineHeight: 1.55 }, children: ticket.description }) })), ticket.resolutionNote && (_jsx(Card, { title: "\u00C7\u00F6z\u00FCm Notu", head: _jsx("span", { className: "badge tone-green", children: ticket.resolutionCode }), children: _jsx("p", { style: { margin: 0, whiteSpace: "pre-wrap", fontSize: "var(--fs-body)", color: "var(--text-primary)", lineHeight: 1.55 }, children: ticket.resolutionNote }) })), ticket.closeReason && ticket.status === "CLOSED" && (_jsx(Card, { title: "Kapama Nedeni", children: _jsx("p", { style: { margin: 0, whiteSpace: "pre-wrap", fontSize: "var(--fs-body)", color: "var(--text-primary)", lineHeight: 1.55 }, children: ticket.closeReason }) })), ticket.sla && (ticket.sla.level === "RISK" || ticket.sla.level === "BREACH") && (isAgent() || isManager()) && (_jsxs(WarnBanner, { children: [_jsxs("b", { children: ["SLA ", SLA_LEVEL_META[ticket.sla.level].label.toLowerCase(), "."] }), " Bu talep risk alt\u0131nda, h\u0131zl\u0131 aksiyon gerekli."] })), _jsxs("div", { className: "tabs", children: [_jsxs("div", { className: "tab " + (tab === "timeline" ? "active" : ""), onClick: () => setTab("timeline"), children: ["Zaman \u00C7izgisi", _jsx("span", { className: "cnt tnum", children: visibleTimeline.length })] }), _jsxs("div", { className: "tab " + (tab === "attach" ? "active" : ""), onClick: () => setTab("attach"), children: ["Ekler", _jsx("span", { className: "cnt tnum", children: attachments.length })] })] }), tab === "timeline" && (_jsxs(_Fragment, { children: [visibleTimeline.length === 0 ? (_jsx(Card, { children: _jsx(EmptyState, { icon: "comment", title: "Hen\u00FCz aktivite yok", body: "Yorum ekleyerek ba\u015Flay\u0131n." }) })) : (_jsx("div", { className: "timeline", children: visibleTimeline.map((ev) => _jsx(TimelineItem, { event: ev }, ev.id)) })), ticket.status !== "CLOSED" && allowedActions.has("ADD_COMMENT") && (_jsx(CommentComposer, { ticketId: ticketId, canPostInternal: !isCustomer(), onAdded: (ev) => setTimeline((prev) => [...prev, ev]) }))] })), tab === "attach" && (_jsx(Card, { children: _jsx(AttachmentsList, { attachments: attachments, canUpload: allowedActions.has("ADD_ATTACHMENT"), canPostInternal: !isCustomer(), uploading: uploading, onUpload: uploadFile, onDownload: downloadAttachment }) }))] }), _jsxs("div", { className: "card card-pad col", style: { position: "sticky", top: 0 }, children: [ticket.sla && (_jsxs("div", { className: "col gap-2", style: { paddingBottom: 12, borderBottom: "1px solid var(--border-faint)" }, children: [_jsxs("div", { className: "row", style: { justifyContent: "space-between" }, children: [_jsx("span", { className: "eyebrow", children: "SLA" }), _jsx("span", { className: "badge " + (ticket.sla.level === "BREACH" ? "tone-red" : ticket.sla.level === "RISK" ? "tone-orange" : ticket.sla.level === "WARNING" ? "tone-amber" : "tone-green"), children: SLA_LEVEL_META[ticket.sla.level].label })] }), _jsx(SLABar, { sla: ticket.sla }), _jsxs("div", { className: "row", style: { justifyContent: "space-between", fontSize: "var(--fs-cap)", color: "var(--text-secondary)" }, children: [_jsx("span", { children: "Hedef" }), _jsxs("span", { className: "tnum", children: [(ticket.sla.deadlineSeconds / 3600).toFixed(1), " sa"] })] }), _jsxs("div", { className: "row", style: { justifyContent: "space-between", fontSize: "var(--fs-cap)", color: "var(--text-secondary)" }, children: [_jsx("span", { children: "Saat durumu" }), _jsx("span", { className: "tnum", children: ticket.sla.clockState === "RUNNING" ? "Çalışıyor" : ticket.sla.clockState === "PAUSED" ? "Duraklatıldı" : "Durduruldu" })] })] })), _jsxs("div", { className: "meta-row", children: [_jsx("span", { className: "k", children: "Atanan" }), _jsx("span", { className: "v", children: ticket.assigneeId ? _jsx(Assignee, { id: ticket.assigneeId, name: formatActor(ticket.assigneeId) }) : _jsx("span", { className: "faint", children: "Atanmad\u0131" }) })] }), _jsxs("div", { className: "meta-row", children: [_jsx("span", { className: "k", children: "T\u00FCr" }), _jsx("span", { className: "v", children: _jsx(TypeBadge, { type: ticket.type }) })] }), !isCustomer() && _jsxs("div", { className: "meta-row", children: [_jsx("span", { className: "k", children: "\u00D6ncelik" }), _jsx("span", { className: "v", children: _jsx(PriorityPill, { priority: ticket.priority }) })] }), !isCustomer() && _jsxs("div", { className: "meta-row", children: [_jsx("span", { className: "k", children: "Etki" }), _jsx("span", { className: "v", children: ticket.impact })] }), !isCustomer() && _jsxs("div", { className: "meta-row", children: [_jsx("span", { className: "k", children: "Aciliyet" }), _jsx("span", { className: "v", children: ticket.urgency })] }), ticket.approvalState && _jsxs("div", { className: "meta-row", children: [_jsx("span", { className: "k", children: "Onay" }), _jsx("span", { className: "v", children: ticket.approvalState })] }), _jsxs("div", { className: "meta-row", children: [_jsx("span", { className: "k", children: "Olu\u015Fturuldu" }), _jsx("span", { className: "v", children: formatDateTime(ticket.createdAt) })] }), _jsxs("div", { className: "meta-row", children: [_jsx("span", { className: "k", children: "G\u00FCncellendi" }), _jsx("span", { className: "v", children: formatDateTime(ticket.updatedAt) })] }), ticket.resolvedAt && _jsxs("div", { className: "meta-row", children: [_jsx("span", { className: "k", children: "\u00C7\u00F6z\u00FCld\u00FC" }), _jsx("span", { className: "v", children: formatDateTime(ticket.resolvedAt) })] }), ticket.closedAt && _jsxs("div", { className: "meta-row", children: [_jsx("span", { className: "k", children: "Kapand\u0131" }), _jsx("span", { className: "v", children: formatDateTime(ticket.closedAt) })] }), feedback && (_jsxs("div", { style: { marginTop: 14, padding: "12px 0 0", borderTop: "1px solid var(--border-faint)" }, children: [_jsx("span", { className: "eyebrow", children: "M\u00FC\u015Fteri Geri Bildirimi" }), _jsxs("div", { className: "row", style: { gap: 8, marginTop: 8 }, children: [_jsx(Stars, { value: feedback.rating, size: 18 }), _jsxs("span", { className: "tnum", style: { fontWeight: 600 }, children: [feedback.rating, "/5"] })] }), feedback.comment && _jsx("p", { style: { margin: "8px 0 0", fontSize: "var(--fs-sm)", color: "var(--text-secondary)", whiteSpace: "pre-wrap" }, children: feedback.comment })] }))] })] }), _jsx(ResolveDialog, { open: dialog === "resolve", submitting: actionSubmitting, onClose: () => !actionSubmitting && setDialog(null), onSubmit: (resolutionNote, resolutionCode) => {
                    const payload = { resolutionNote, resolutionCode };
                    return runAction(() => http.post(`/api/v1/tickets/${ticketId}/resolve`, payload), () => setDialog(null), "Talep çözüldü");
                } }), _jsx(ConfirmCloseDialog, { open: dialog === "confirmClose", submitting: actionSubmitting, onClose: () => !actionSubmitting && setDialog(null), onSubmit: () => runAction(() => http.post(`/api/v1/tickets/${ticketId}/confirm-close`), () => setDialog(null), "Talep kapatıldı") }), _jsx(ForceCloseDialog, { open: dialog === "forceClose", submitting: actionSubmitting, onClose: () => !actionSubmitting && setDialog(null), onSubmit: (reason) => {
                    const payload = { reason };
                    return runAction(() => http.post(`/api/v1/tickets/${ticketId}/force-close`, payload), () => setDialog(null), "Talep zorla kapatıldı");
                } }), _jsx(ChangePriorityDialog, { open: dialog === "priority", submitting: actionSubmitting, currentImpact: ticket.impact, currentUrgency: ticket.urgency, onClose: () => !actionSubmitting && setDialog(null), onSubmit: (payload) => {
                    const body = payload;
                    return runAction(() => http.patch(`/api/v1/tickets/${ticketId}/priority`, body), () => setDialog(null), "Öncelik güncellendi");
                } }), _jsx(OverrideStatusDialog, { open: dialog === "override", submitting: actionSubmitting, currentStatus: ticket.status, onClose: () => !actionSubmitting && setDialog(null), onSubmit: (payload) => {
                    const body = payload;
                    return runAction(() => http.post(`/api/v1/tickets/${ticketId}/override-status`, body), () => setDialog(null), "Durum değiştirildi");
                } }), _jsx(ReassignDialog, { open: dialog === "reassign", submitting: actionSubmitting, currentAssignee: ticket.assigneeId, onClose: () => !actionSubmitting && setDialog(null), onSubmit: (payload) => {
                    const body = payload;
                    return runAction(() => http.post(`/api/v1/tickets/${ticketId}/reassign`, body), () => setDialog(null), "Yeniden atandı");
                } }), _jsx(ConfirmResumeDialog, { open: dialog === "confirmResume", submitting: transitioning === "IN_PROGRESS", onClose: () => setDialog(null), onSubmit: () => { setDialog(null); return handlePlainTransition("IN_PROGRESS"); } }), _jsx(ApproveDialog, { open: dialog === "approve", submitting: actionSubmitting, onClose: () => !actionSubmitting && setDialog(null), onSubmit: () => runAction(() => http.post(`/api/v1/tickets/${ticketId}/approve`), () => setDialog(null), "Onaylandı") }), _jsx(RejectDialog, { open: dialog === "reject", submitting: actionSubmitting, onClose: () => !actionSubmitting && setDialog(null), onSubmit: (reason) => runAction(() => http.post(`/api/v1/tickets/${ticketId}/reject`, { reason }), () => setDialog(null), "Reddedildi") }), _jsx(ComplaintDialog, { open: dialog === "complaint", submitting: actionSubmitting, onClose: () => !actionSubmitting && setDialog(null), onSubmit: async (body) => {
                    setActionSubmitting(true);
                    try {
                        await http.post(`/api/v1/tickets/${ticketId}/complaints`, { body });
                        await refreshTimeline();
                        toast.success("Şikayetiniz alındı");
                        setDialog(null);
                    }
                    catch {
                        toast.error("İşlem başarısız");
                    }
                    finally {
                        setActionSubmitting(false);
                    }
                } }), _jsx(FeedbackDialog, { open: dialog === "feedback", submitting: actionSubmitting, onClose: () => !actionSubmitting && setDialog(null), onSubmit: async (rating, comment) => {
                    setActionSubmitting(true);
                    try {
                        const res = await http.post(`/api/v1/tickets/${ticketId}/feedback`, { rating, comment });
                        setFeedback(res.data);
                        toast.success("Geri bildiriminiz kaydedildi");
                        setDialog(null);
                    }
                    catch {
                        toast.error("İşlem başarısız");
                    }
                    finally {
                        setActionSubmitting(false);
                    }
                } })] }));
};
function TimelineItem({ event }) {
    if (event.eventType === "SYSTEM_EVENT") {
        return (_jsxs("div", { className: "tl-item", children: [_jsx("div", { className: "tl-dot", children: _jsx(Icon, { name: "gear", size: 11 }) }), _jsxs("div", { className: "tl-system", children: [_jsx("span", { children: parsePayload(event.payload) || "Sistem olayı" }), _jsx("span", { style: { marginLeft: "auto", fontSize: "var(--fs-cap)" }, children: formatRelative(event.occurredAt) })] })] }));
    }
    const isWork = event.eventType === "WORKLOG";
    const display = formatActor(event.actorId);
    return (_jsxs("div", { className: "tl-item " + (isWork ? "tl-worklog" : "tl-comment"), children: [_jsx("div", { className: "tl-dot", style: isWork ? { background: "var(--bg-subtle)" } : undefined, children: _jsx(Icon, { name: isWork ? "pencil" : "comment", size: 11 }) }), _jsxs("div", { className: "tl-card", children: [_jsxs("div", { className: "tl-head", children: [_jsx(Avatar, { name: display, size: "sm" }), _jsx("span", { className: "tl-author", children: display }), _jsx(VisibilityPill, { vis: event.visibility }), _jsx("span", { className: "tl-time", children: formatRelative(event.occurredAt) })] }), _jsx("div", { className: "tl-body", style: { whiteSpace: "pre-wrap" }, children: event.body })] })] }));
}
function parsePayload(payload) {
    if (!payload)
        return "";
    try {
        const d = JSON.parse(payload);
        if (d.event === "STATUS_CHANGED")
            return `Durum: ${d.from} → ${d.to}`;
        if (d.event === "PRIORITY_CHANGED")
            return `Öncelik: ${d.from} → ${d.to}`;
        if (d.event === "TICKET_CREATED")
            return "Talep oluşturuldu";
        return d.event ?? "Sistem olayı";
    }
    catch {
        return "Sistem olayı";
    }
}
function CommentComposer({ ticketId, canPostInternal, onAdded }) {
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
            const res = await http.post(`/api/v1/tickets/${ticketId}/comments`, payload);
            onAdded(res.data);
            setBody("");
            textareaRef.current?.focus();
        }
        catch {
            toast.error("Yorum gönderilemedi");
        }
        finally {
            setSubmitting(false);
        }
    };
    const onKeyDown = (e) => {
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey))
            void submit(e);
    };
    return (_jsxs("form", { className: "card card-pad col gap-3", onSubmit: (e) => void submit(e), children: [_jsxs("div", { className: "row", style: { gap: 8 }, children: [_jsx("span", { className: "eyebrow", children: "Yorum Ekle" }), canPostInternal && (_jsxs("div", { className: "seg", style: { marginLeft: "auto" }, children: [_jsxs("button", { type: "button", className: visibility === "EXTERNAL" ? "on" : "", onClick: () => setVisibility("EXTERNAL"), children: [_jsx(Icon, { name: "globe", size: 11, style: { marginRight: 5 } }), "Genel"] }), _jsxs("button", { type: "button", className: visibility === "INTERNAL" ? "on" : "", onClick: () => setVisibility("INTERNAL"), children: [_jsx(Icon, { name: "lock", size: 11, style: { marginRight: 5 } }), "Dahili"] })] }))] }), _jsx("textarea", { ref: textareaRef, value: body, onChange: (e) => setBody(e.target.value), onKeyDown: onKeyDown, rows: 4, maxLength: COMMENT_MAX, placeholder: "Yorumunuzu yaz\u0131n\u2026 (Ctrl+Enter ile g\u00F6nder)", style: {
                    width: "100%",
                    minHeight: 90,
                    padding: 11,
                    border: "1px solid var(--border)",
                    borderRadius: "var(--r-md)",
                    background: "var(--bg-subtle)",
                    fontSize: "var(--fs-sm)",
                    color: "var(--text-primary)",
                    fontFamily: "inherit",
                    resize: "vertical",
                    outline: "none"
                } }), _jsxs("div", { className: "row", style: { gap: 8 }, children: [_jsxs("span", { className: "faint", style: { fontSize: "var(--fs-cap)" }, children: [body.length, " / ", COMMENT_MAX] }), _jsx("span", { style: { flex: 1 } }), _jsxs("button", { type: "submit", className: "btn btn-primary", disabled: !body.trim() || submitting, children: [_jsx(Icon, { name: "send", size: 13 }), "G\u00F6nder"] })] })] }));
}
function AttachmentsList({ attachments, canUpload, canPostInternal, uploading, onUpload, onDownload }) {
    const fileInputRef = useRef(null);
    const [visibility, setVisibility] = useState("EXTERNAL");
    if (attachments.length === 0 && !canUpload) {
        return _jsx(EmptyState, { icon: "paperclip", title: "Ek dosya yok", body: "Bu talepte hen\u00FCz ek bulunmuyor." });
    }
    return (_jsxs("div", { className: "col gap-3", children: [attachments.length === 0 ? (_jsx("p", { className: "faint", style: { fontSize: "var(--fs-sm)" }, children: "Hen\u00FCz ek yok." })) : (attachments.map((a) => (_jsxs("div", { className: "row", style: { gap: 10, padding: "10px 12px", border: "1px solid var(--border)", borderRadius: "var(--r-md)" }, children: [_jsx("div", { style: { width: 32, height: 32, borderRadius: "var(--r-sm)", background: "var(--bg-inset)", display: "grid", placeItems: "center", color: "var(--text-secondary)" }, children: _jsx(Icon, { name: "paperclip", size: 14 }) }), _jsxs("div", { className: "col", style: { flex: 1, minWidth: 0 }, children: [_jsx("span", { style: { fontSize: "var(--fs-sm)", fontWeight: 550, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: a.fileName }), _jsxs("span", { className: "faint", style: { fontSize: "var(--fs-cap)" }, children: [formatBytes(a.sizeBytes), " \u00B7 ", formatActor(a.uploadedBy), " \u00B7 ", formatRelative(a.uploadedAt), a.visibility === "INTERNAL" && _jsxs(_Fragment, { children: [" \u00B7 ", _jsx(VisibilityPill, { vis: "INTERNAL" })] })] })] }), _jsx("button", { className: "iconbtn", onClick: () => void onDownload(a), "aria-label": "\u0130ndir", children: _jsx(Icon, { name: "download", size: 14 }) })] }, a.id)))), canUpload && (_jsxs("div", { className: "row", style: { gap: 8, paddingTop: 8, borderTop: "1px solid var(--border-faint)" }, children: [canPostInternal && (_jsxs("div", { className: "seg", children: [_jsx("button", { className: visibility === "EXTERNAL" ? "on" : "", onClick: () => setVisibility("EXTERNAL"), children: "Genel" }), _jsx("button", { className: visibility === "INTERNAL" ? "on" : "", onClick: () => setVisibility("INTERNAL"), children: "Dahili" })] })), _jsxs("button", { className: "btn", onClick: () => fileInputRef.current?.click(), disabled: uploading, children: [_jsx(Icon, { name: "paperclip", size: 13 }), uploading ? "Yükleniyor…" : "Dosya yükle"] }), _jsx("input", { ref: fileInputRef, type: "file", style: { display: "none" }, onChange: (e) => {
                            const f = e.target.files?.[0];
                            if (f)
                                void onUpload(f, visibility);
                            e.target.value = "";
                        } })] }))] }));
}
function formatBytes(bytes) {
    if (bytes < 1024)
        return `${bytes} B`;
    if (bytes < 1024 * 1024)
        return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
function ComplaintDialog({ open, submitting, onClose, onSubmit }) {
    const [body, setBody] = useState("");
    useEffect(() => { if (!open)
        setBody(""); }, [open]);
    return (_jsxs(Dialog, { open: open, onClose: onClose, title: "Servis Kalitesi \u015Eikayeti", footer: _jsxs(_Fragment, { children: [_jsx(Button, { variant: "ghost", onClick: onClose, disabled: submitting, children: "\u0130ptal" }), _jsx(Button, { variant: "primary", loading: submitting, disabled: !body.trim() || submitting, onClick: () => onSubmit(body.trim()), children: "G\u00F6nder" })] }), children: [_jsx("p", { className: "text-muted text-xs", style: { marginBottom: 8 }, children: "\u015Eikayetiniz do\u011Frudan y\u00F6neticilere iletilecektir." }), _jsx(Textarea, { value: body, onChange: (e) => setBody(e.target.value), rows: 5, maxLength: 4000, placeholder: "\u015Eikayetinizi a\u00E7\u0131klay\u0131n..." })] }));
}
function FeedbackDialog({ open, submitting, onClose, onSubmit }) {
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");
    useEffect(() => { if (!open) {
        setRating(5);
        setComment("");
    } }, [open]);
    return (_jsxs(Dialog, { open: open, onClose: onClose, title: "Geri Bildirim", footer: _jsxs(_Fragment, { children: [_jsx(Button, { variant: "ghost", onClick: onClose, disabled: submitting, children: "\u0130ptal" }), _jsx(Button, { variant: "primary", loading: submitting, disabled: submitting, onClick: () => onSubmit(rating, comment.trim()), children: "G\u00F6nder" })] }), children: [_jsxs("div", { style: { marginBottom: 12 }, children: [_jsx("label", { style: { display: "block", marginBottom: 4, fontSize: 13, fontWeight: 500 }, children: "Puan\u0131n\u0131z" }), _jsx("div", { style: { display: "flex", gap: 4 }, children: [1, 2, 3, 4, 5].map((n) => (_jsx("button", { type: "button", onClick: () => setRating(n), style: { background: "none", border: "none", cursor: "pointer", fontSize: 28, lineHeight: 1, color: n <= rating ? "#f5b400" : "#cbd5e1", padding: 0 }, children: n <= rating ? "★" : "☆" }, n))) })] }), _jsx(Textarea, { value: comment, onChange: (e) => setComment(e.target.value), rows: 4, maxLength: 4000, placeholder: "Yorumunuz (opsiyonel)..." })] }));
}
