import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";

import { http } from "../api/http";
import { useRole } from "../auth/useRole";
import {
  ApproveDialog,
  ChangePriorityDialog,
  ConfirmCloseDialog,
  ConfirmResumeDialog,
  ForceCloseDialog,
  OverrideStatusDialog,
  ReassignDialog,
  RejectDialog,
  ResolveDialog
} from "../components/ticket/TicketActionDialogs";
import { Card, EmptyState, ErrorBanner, WarnBanner } from "../components/itsm/Common";
import { Icon } from "../components/itsm/Icon";
import { Assignee, Avatar, PriorityPill, SLABar, StatusBadge, Stars, TypeBadge, VisibilityPill } from "../components/itsm/Primitives";
import { SLA_LEVEL_META, STATUS_META } from "../components/itsm/meta";
import { Dialog } from "../components/ui/Dialog";
import { Button } from "../components/ui/Button";
import { Textarea } from "../components/ui/Input";
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
  Visibility
} from "../types/api";
import { PLAIN_STATUS_TRANSITIONS } from "../types/api";

const COMMENT_MAX = 10000;

type Props = { ticketId: string; onBack: () => void };

type DialogKind =
  | "resolve" | "confirmClose" | "confirmResume" | "forceClose"
  | "priority" | "reassign" | "override" | "approve" | "reject"
  | "complaint" | "feedback" | null;

type FeedbackData = {
  ticketId: string;
  customerId: string;
  agentId: string | null;
  rating: number;
  comment: string | null;
  submittedAt: string;
};

export const TicketDetailPage = ({ ticketId, onBack }: Props) => {
  const { isCustomer, isAgent, isManager } = useRole();
  const toast = useToast();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [feedback, setFeedback] = useState<FeedbackData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transitioning, setTransitioning] = useState<TicketStatus | null>(null);
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [actionSubmitting, setActionSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [tab, setTab] = useState<"timeline" | "attach" | "audit">("timeline");

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [tk, tl, at] = await Promise.all([
        http.get<Ticket>(`/api/v1/tickets/${ticketId}`),
        http.get<TimelineEvent[]>(`/api/v1/tickets/${ticketId}/timeline`),
        http.get<Attachment[]>(`/api/v1/tickets/${ticketId}/attachments`)
      ]);
      setTicket(tk.data);
      setTimeline(tl.data);
      setAttachments(at.data);
      if (tk.data.status === "CLOSED") {
        try {
          const fb = await http.get<FeedbackData>(`/api/v1/tickets/${ticketId}/feedback`);
          setFeedback(fb.status === 204 ? null : fb.data);
        } catch { setFeedback(null); }
      } else { setFeedback(null); }
    } catch {
      setError("Talep yüklenemedi.");
    } finally { setLoading(false); }
  }, [ticketId]);

  const refreshTimeline = useCallback(async () => {
    try {
      const res = await http.get<TimelineEvent[]>(`/api/v1/tickets/${ticketId}/timeline`);
      setTimeline(res.data);
    } catch { /* ignore */ }
  }, [ticketId]);

  const refreshAttachments = useCallback(async () => {
    try {
      const res = await http.get<Attachment[]>(`/api/v1/tickets/${ticketId}/attachments`);
      setAttachments(res.data);
    } catch { /* ignore */ }
  }, [ticketId]);

  useEffect(() => { void fetchAll(); }, [fetchAll]);

  const handlePlainTransition = async (target: TicketStatus) => {
    setTransitioning(target);
    try {
      const res = await http.patch<Ticket>(`/api/v1/tickets/${ticketId}/status`, { status: target });
      setTicket(res.data);
      await refreshTimeline();
      toast.success("Durum değiştirildi", STATUS_META[target].label);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Durum değiştirilemedi");
    } finally { setTransitioning(null); }
  };

  const handleTakeOwnership = async () => {
    setActionSubmitting(true);
    try {
      const res = await http.post<Ticket>(`/api/v1/tickets/${ticketId}/take-ownership`);
      setTicket(res.data);
      await refreshTimeline();
      toast.success("Talep sahiplenildi");
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "İşlem başarısız");
    } finally { setActionSubmitting(false); }
  };

  const runAction = async (req: () => Promise<{ data: Ticket }>, onOk: () => void, msg: string) => {
    setActionSubmitting(true);
    try {
      const res = await req();
      setTicket(res.data);
      await refreshTimeline();
      toast.success(msg);
      onOk();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "İşlem başarısız");
    } finally { setActionSubmitting(false); }
  };

  const uploadFile = async (file: File, visibility: Visibility) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("visibility", visibility);
      await http.post(`/api/v1/tickets/${ticketId}/attachments/upload`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      await refreshAttachments();
      await refreshTimeline();
      toast.success("Ek yüklendi");
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Yükleme başarısız");
    } finally { setUploading(false); }
  };

  const downloadAttachment = async (att: Attachment) => {
    try {
      const res = await http.get<Blob>(`/api/v1/tickets/${ticketId}/attachments/${att.id}/download`, { responseType: "blob" });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url; a.download = att.fileName;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    } catch { toast.error("İndirme başarısız"); }
  };

  if (loading) {
    return <div className="col gap-4"><div className="sk" style={{ height: 200, borderRadius: 8 }} /></div>;
  }
  if (error || !ticket) {
    return (
      <div className="col gap-4">
        <ErrorBanner msg={error ?? "Talep bulunamadı."} onRetry={() => void fetchAll()} />
        <div><button className="btn" onClick={onBack}><Icon name="chevright" size={13} style={{ transform: "rotate(180deg)" }} />Listeye dön</button></div>
      </div>
    );
  }

  const allowedActions = new Set<TicketAction>(ticket.allowedActions);
  const canRunPlain = isAgent() || isManager();
  const plainTransitions = canRunPlain
    ? PLAIN_STATUS_TRANSITIONS[ticket.status].filter((target) => {
        if (target === "IN_PROGRESS" && ticket.type === "SERVICE_REQUEST" && ticket.approvalState === "PENDING") return false;
        return true;
      })
    : [];

  const visibleTimeline = isCustomer() ? timeline.filter((e) => e.visibility !== "INTERNAL") : timeline;

  return (
    <div className="col gap-4">
      <div>
        <div className="row" style={{ gap: 8, marginBottom: 8 }}>
          <span className="crumb faint" style={{ fontSize: "var(--fs-cap)", cursor: "pointer" }} onClick={onBack}>Talepler /</span>
          <span className="mono" style={{ fontSize: "var(--fs-cap)", color: "var(--text-tertiary)" }}>#{ticket.id.slice(0, 8)}</span>
        </div>
        <div className="row" style={{ gap: 12, alignItems: "flex-start" }}>
          <div className="col" style={{ flex: 1, gap: 9 }}>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 650, letterSpacing: "-.3px", lineHeight: 1.25 }}>{ticket.title}</h1>
            <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
              <StatusBadge status={ticket.status} />
              <TypeBadge type={ticket.type} />
              {!isCustomer() && <PriorityPill priority={ticket.priority} />}
              <span className="faint" style={{ fontSize: "var(--fs-cap)" }}>· güncellendi {formatRelative(ticket.updatedAt)}</span>
            </div>
          </div>
          <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
            {allowedActions.has("TAKE_OWNERSHIP") && (
              <button className="btn btn-primary" onClick={() => void handleTakeOwnership()} disabled={actionSubmitting}>
                <Icon name="user" size={13} />Sahiplen
              </button>
            )}
            {allowedActions.has("RESOLVE") && (
              <button className="btn btn-primary" onClick={() => setDialog("resolve")} disabled={actionSubmitting}>
                <Icon name="check" size={13} />Çöz
              </button>
            )}
            {allowedActions.has("CONFIRM_CLOSE") && (
              <button className="btn btn-primary" onClick={() => setDialog("confirmClose")} disabled={actionSubmitting}>
                <Icon name="check" size={13} />Onayla & Kapat
              </button>
            )}
            {allowedActions.has("REASSIGN") && (
              <button className="btn" onClick={() => setDialog("reassign")} disabled={actionSubmitting}>
                <Icon name="users" size={13} />Yeniden Ata
              </button>
            )}
            {allowedActions.has("OVERRIDE_STATUS") && (
              <button className="btn" onClick={() => setDialog("override")} disabled={actionSubmitting}>
                <Icon name="shield" size={13} />Müdahale
              </button>
            )}
            {allowedActions.has("FORCE_CLOSE") && (
              <button className="btn btn-danger" onClick={() => setDialog("forceClose")} disabled={actionSubmitting}>
                <Icon name="lock" size={13} />Zorla Kapat
              </button>
            )}
            {allowedActions.has("APPROVE_REQUEST") && (
              <button className="btn btn-primary" onClick={() => setDialog("approve")} disabled={actionSubmitting}>
                <Icon name="check" size={13} />Onayla
              </button>
            )}
            {allowedActions.has("REJECT_REQUEST") && (
              <button className="btn btn-danger" onClick={() => setDialog("reject")} disabled={actionSubmitting}>
                <Icon name="x" size={13} />Reddet
              </button>
            )}
            {allowedActions.has("CHANGE_PRIORITY") && (
              <button className="btn" onClick={() => setDialog("priority")} disabled={actionSubmitting}>
                <Icon name="settings" size={13} />Öncelik
              </button>
            )}
            {allowedActions.has("REQUEST_INFO") && isCustomer() && (
              <button className="btn btn-primary" onClick={() => setDialog("confirmResume")} disabled={transitioning !== null || actionSubmitting}>
                <Icon name="check" size={13} />Yanıtladım — Devam Et
              </button>
            )}
            {allowedActions.has("REOPEN_REQUEST") && (
              <button className="btn" onClick={() => void handlePlainTransition("IN_PROGRESS")} disabled={transitioning !== null}>
                <Icon name="reopen" size={13} />Yeniden Aç
              </button>
            )}
            {plainTransitions.map((target) => (
              <button key={target} className="btn" onClick={() => void handlePlainTransition(target)} disabled={transitioning !== null}>
                <Icon name="chevright" size={13} />{STATUS_META[target].label}
              </button>
            ))}
            {isCustomer() && ticket.status !== "CLOSED" && (
              <button className="btn btn-danger" onClick={() => setDialog("complaint")} disabled={actionSubmitting}>
                <Icon name="thumbsdown" size={13} />Şikayet
              </button>
            )}
            {isCustomer() && ticket.status === "CLOSED" && !feedback && (
              <button className="btn btn-primary" onClick={() => setDialog("feedback")} disabled={actionSubmitting}>
                <Icon name="star" size={13} />Değerlendir
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "minmax(0, 1fr) 320px", gap: 18, alignItems: "start" }}>
        <div className="col" style={{ gap: 14 }}>
          {ticket.description && (
            <Card title="Açıklama">
              <p style={{ margin: 0, whiteSpace: "pre-wrap", fontSize: "var(--fs-body)", color: "var(--text-secondary)", lineHeight: 1.55 }}>
                {ticket.description}
              </p>
            </Card>
          )}

          {ticket.resolutionNote && (
            <Card title="Çözüm Notu" head={<span className="badge tone-green">{ticket.resolutionCode}</span>}>
              <p style={{ margin: 0, whiteSpace: "pre-wrap", fontSize: "var(--fs-body)", color: "var(--text-primary)", lineHeight: 1.55 }}>
                {ticket.resolutionNote}
              </p>
            </Card>
          )}

          {ticket.closeReason && ticket.status === "CLOSED" && (
            <Card title="Kapama Nedeni">
              <p style={{ margin: 0, whiteSpace: "pre-wrap", fontSize: "var(--fs-body)", color: "var(--text-primary)", lineHeight: 1.55 }}>
                {ticket.closeReason}
              </p>
            </Card>
          )}

          {ticket.sla && (ticket.sla.level === "RISK" || ticket.sla.level === "BREACH") && (isAgent() || isManager()) && (
            <WarnBanner>
              <b>SLA {SLA_LEVEL_META[ticket.sla.level].label.toLowerCase()}.</b> Bu talep risk altında, hızlı aksiyon gerekli.
            </WarnBanner>
          )}

          <div className="tabs">
            <div className={"tab " + (tab === "timeline" ? "active" : "")} onClick={() => setTab("timeline")}>
              Zaman Çizgisi<span className="cnt tnum">{visibleTimeline.length}</span>
            </div>
            <div className={"tab " + (tab === "attach" ? "active" : "")} onClick={() => setTab("attach")}>
              Ekler<span className="cnt tnum">{attachments.length}</span>
            </div>
          </div>

          {tab === "timeline" && (
            <>
              {visibleTimeline.length === 0 ? (
                <Card><EmptyState icon="comment" title="Henüz aktivite yok" body="Yorum ekleyerek başlayın." /></Card>
              ) : (
                <div className="timeline">
                  {visibleTimeline.map((ev) => <TimelineItem key={ev.id} event={ev} />)}
                </div>
              )}
              {ticket.status !== "CLOSED" && allowedActions.has("ADD_COMMENT") && (
                <CommentComposer
                  ticketId={ticketId}
                  canPostInternal={!isCustomer()}
                  onAdded={(ev) => setTimeline((prev) => [...prev, ev])}
                />
              )}
            </>
          )}

          {tab === "attach" && (
            <Card>
              <AttachmentsList
                attachments={attachments}
                canUpload={allowedActions.has("ADD_ATTACHMENT")}
                canPostInternal={!isCustomer()}
                uploading={uploading}
                onUpload={uploadFile}
                onDownload={downloadAttachment}
              />
            </Card>
          )}
        </div>

        <div className="card card-pad col" style={{ position: "sticky", top: 0 }}>
          {ticket.sla && (
            <div className="col gap-2" style={{ paddingBottom: 12, borderBottom: "1px solid var(--border-faint)" }}>
              <div className="row" style={{ justifyContent: "space-between" }}>
                <span className="eyebrow">SLA</span>
                <span className={"badge " + (ticket.sla.level === "BREACH" ? "tone-red" : ticket.sla.level === "RISK" ? "tone-orange" : ticket.sla.level === "WARNING" ? "tone-amber" : "tone-green")}>
                  {SLA_LEVEL_META[ticket.sla.level].label}
                </span>
              </div>
              <SLABar sla={ticket.sla} />
              <div className="row" style={{ justifyContent: "space-between", fontSize: "var(--fs-cap)", color: "var(--text-secondary)" }}>
                <span>Hedef</span>
                <span className="tnum">{(ticket.sla.deadlineSeconds / 3600).toFixed(1)} sa</span>
              </div>
              <div className="row" style={{ justifyContent: "space-between", fontSize: "var(--fs-cap)", color: "var(--text-secondary)" }}>
                <span>Saat durumu</span>
                <span className="tnum">{ticket.sla.clockState === "RUNNING" ? "Çalışıyor" : ticket.sla.clockState === "PAUSED" ? "Duraklatıldı" : "Durduruldu"}</span>
              </div>
            </div>
          )}

          <div className="meta-row"><span className="k">Atanan</span><span className="v">{ticket.assigneeId ? <Assignee id={ticket.assigneeId} name={formatActor(ticket.assigneeId)} /> : <span className="faint">Atanmadı</span>}</span></div>
          <div className="meta-row"><span className="k">Tür</span><span className="v"><TypeBadge type={ticket.type} /></span></div>
          {!isCustomer() && <div className="meta-row"><span className="k">Öncelik</span><span className="v"><PriorityPill priority={ticket.priority} /></span></div>}
          {!isCustomer() && <div className="meta-row"><span className="k">Etki</span><span className="v">{ticket.impact}</span></div>}
          {!isCustomer() && <div className="meta-row"><span className="k">Aciliyet</span><span className="v">{ticket.urgency}</span></div>}
          {ticket.approvalState && <div className="meta-row"><span className="k">Onay</span><span className="v">{ticket.approvalState}</span></div>}
          <div className="meta-row"><span className="k">Oluşturuldu</span><span className="v">{formatDateTime(ticket.createdAt)}</span></div>
          <div className="meta-row"><span className="k">Güncellendi</span><span className="v">{formatDateTime(ticket.updatedAt)}</span></div>
          {ticket.resolvedAt && <div className="meta-row"><span className="k">Çözüldü</span><span className="v">{formatDateTime(ticket.resolvedAt)}</span></div>}
          {ticket.closedAt && <div className="meta-row"><span className="k">Kapandı</span><span className="v">{formatDateTime(ticket.closedAt)}</span></div>}

          {feedback && (
            <div style={{ marginTop: 14, padding: "12px 0 0", borderTop: "1px solid var(--border-faint)" }}>
              <span className="eyebrow">Müşteri Geri Bildirimi</span>
              <div className="row" style={{ gap: 8, marginTop: 8 }}>
                <Stars value={feedback.rating} size={18} />
                <span className="tnum" style={{ fontWeight: 600 }}>{feedback.rating}/5</span>
              </div>
              {feedback.comment && <p style={{ margin: "8px 0 0", fontSize: "var(--fs-sm)", color: "var(--text-secondary)", whiteSpace: "pre-wrap" }}>{feedback.comment}</p>}
            </div>
          )}
        </div>
      </div>

      {/* Action dialogs */}
      <ResolveDialog
        open={dialog === "resolve"}
        submitting={actionSubmitting}
        onClose={() => !actionSubmitting && setDialog(null)}
        onSubmit={(resolutionNote, resolutionCode) => {
          const payload: ResolveTicketPayload = { resolutionNote, resolutionCode };
          return runAction(() => http.post<Ticket>(`/api/v1/tickets/${ticketId}/resolve`, payload), () => setDialog(null), "Talep çözüldü");
        }}
      />
      <ConfirmCloseDialog
        open={dialog === "confirmClose"}
        submitting={actionSubmitting}
        onClose={() => !actionSubmitting && setDialog(null)}
        onSubmit={() => runAction(() => http.post<Ticket>(`/api/v1/tickets/${ticketId}/confirm-close`), () => setDialog(null), "Talep kapatıldı")}
      />
      <ForceCloseDialog
        open={dialog === "forceClose"}
        submitting={actionSubmitting}
        onClose={() => !actionSubmitting && setDialog(null)}
        onSubmit={(reason) => {
          const payload: ForceClosePayload = { reason };
          return runAction(() => http.post<Ticket>(`/api/v1/tickets/${ticketId}/force-close`, payload), () => setDialog(null), "Talep zorla kapatıldı");
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
          return runAction(() => http.patch<Ticket>(`/api/v1/tickets/${ticketId}/priority`, body), () => setDialog(null), "Öncelik güncellendi");
        }}
      />
      <OverrideStatusDialog
        open={dialog === "override"}
        submitting={actionSubmitting}
        currentStatus={ticket.status}
        onClose={() => !actionSubmitting && setDialog(null)}
        onSubmit={(payload) => {
          const body: OverrideStatusPayload = payload;
          return runAction(() => http.post<Ticket>(`/api/v1/tickets/${ticketId}/override-status`, body), () => setDialog(null), "Durum değiştirildi");
        }}
      />
      <ReassignDialog
        open={dialog === "reassign"}
        submitting={actionSubmitting}
        currentAssignee={ticket.assigneeId}
        onClose={() => !actionSubmitting && setDialog(null)}
        onSubmit={(payload) => {
          const body: ReassignPayload = payload;
          return runAction(() => http.post<Ticket>(`/api/v1/tickets/${ticketId}/reassign`, body), () => setDialog(null), "Yeniden atandı");
        }}
      />
      <ConfirmResumeDialog
        open={dialog === "confirmResume"}
        submitting={transitioning === "IN_PROGRESS"}
        onClose={() => setDialog(null)}
        onSubmit={() => { setDialog(null); return handlePlainTransition("IN_PROGRESS"); }}
      />
      <ApproveDialog
        open={dialog === "approve"}
        submitting={actionSubmitting}
        onClose={() => !actionSubmitting && setDialog(null)}
        onSubmit={() => runAction(() => http.post<Ticket>(`/api/v1/tickets/${ticketId}/approve`), () => setDialog(null), "Onaylandı")}
      />
      <RejectDialog
        open={dialog === "reject"}
        submitting={actionSubmitting}
        onClose={() => !actionSubmitting && setDialog(null)}
        onSubmit={(reason) => runAction(() => http.post<Ticket>(`/api/v1/tickets/${ticketId}/reject`, { reason }), () => setDialog(null), "Reddedildi")}
      />
      <ComplaintDialog
        open={dialog === "complaint"}
        submitting={actionSubmitting}
        onClose={() => !actionSubmitting && setDialog(null)}
        onSubmit={async (body) => {
          setActionSubmitting(true);
          try {
            await http.post(`/api/v1/tickets/${ticketId}/complaints`, { body });
            await refreshTimeline();
            toast.success("Şikayetiniz alındı");
            setDialog(null);
          } catch { toast.error("İşlem başarısız"); }
          finally { setActionSubmitting(false); }
        }}
      />
      <FeedbackDialog
        open={dialog === "feedback"}
        submitting={actionSubmitting}
        onClose={() => !actionSubmitting && setDialog(null)}
        onSubmit={async (rating, comment) => {
          setActionSubmitting(true);
          try {
            const res = await http.post<FeedbackData>(`/api/v1/tickets/${ticketId}/feedback`, { rating, comment });
            setFeedback(res.data);
            toast.success("Geri bildiriminiz kaydedildi");
            setDialog(null);
          } catch { toast.error("İşlem başarısız"); }
          finally { setActionSubmitting(false); }
        }}
      />
    </div>
  );
};

function TimelineItem({ event }: { event: TimelineEvent }) {
  if (event.eventType === "SYSTEM_EVENT") {
    return (
      <div className="tl-item">
        <div className="tl-dot"><Icon name="gear" size={11} /></div>
        <div className="tl-system">
          <span>{parsePayload(event.payload) || "Sistem olayı"}</span>
          <span style={{ marginLeft: "auto", fontSize: "var(--fs-cap)" }}>{formatRelative(event.occurredAt)}</span>
        </div>
      </div>
    );
  }
  const isWork = event.eventType === "WORKLOG";
  const display = formatActor(event.actorId);
  return (
    <div className={"tl-item " + (isWork ? "tl-worklog" : "tl-comment")}>
      <div className="tl-dot" style={isWork ? { background: "var(--bg-subtle)" } : undefined}>
        <Icon name={isWork ? "pencil" : "comment"} size={11} />
      </div>
      <div className="tl-card">
        <div className="tl-head">
          <Avatar name={display} size="sm" />
          <span className="tl-author">{display}</span>
          <VisibilityPill vis={event.visibility} />
          <span className="tl-time">{formatRelative(event.occurredAt)}</span>
        </div>
        <div className="tl-body" style={{ whiteSpace: "pre-wrap" }}>{event.body}</div>
      </div>
    </div>
  );
}

function parsePayload(payload: string | null): string {
  if (!payload) return "";
  try {
    const d = JSON.parse(payload);
    if (d.event === "STATUS_CHANGED") return `Durum: ${d.from} → ${d.to}`;
    if (d.event === "PRIORITY_CHANGED") return `Öncelik: ${d.from} → ${d.to}`;
    if (d.event === "TICKET_CREATED") return "Talep oluşturuldu";
    return d.event ?? "Sistem olayı";
  } catch { return "Sistem olayı"; }
}

function CommentComposer({
  ticketId, canPostInternal, onAdded
}: { ticketId: string; canPostInternal: boolean; onAdded: (e: TimelineEvent) => void }) {
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
      const res = await http.post<TimelineEvent>(`/api/v1/tickets/${ticketId}/comments`, payload);
      onAdded(res.data);
      setBody("");
      textareaRef.current?.focus();
    } catch { toast.error("Yorum gönderilemedi"); }
    finally { setSubmitting(false); }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) void submit(e as unknown as FormEvent);
  };

  return (
    <form className="card card-pad col gap-3" onSubmit={(e) => void submit(e)}>
      <div className="row" style={{ gap: 8 }}>
        <span className="eyebrow">Yorum Ekle</span>
        {canPostInternal && (
          <div className="seg" style={{ marginLeft: "auto" }}>
            <button type="button" className={visibility === "EXTERNAL" ? "on" : ""} onClick={() => setVisibility("EXTERNAL")}>
              <Icon name="globe" size={11} style={{ marginRight: 5 }} />Genel
            </button>
            <button type="button" className={visibility === "INTERNAL" ? "on" : ""} onClick={() => setVisibility("INTERNAL")}>
              <Icon name="lock" size={11} style={{ marginRight: 5 }} />Dahili
            </button>
          </div>
        )}
      </div>
      <textarea
        ref={textareaRef}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={onKeyDown}
        rows={4}
        maxLength={COMMENT_MAX}
        placeholder="Yorumunuzu yazın… (Ctrl+Enter ile gönder)"
        style={{
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
        }}
      />
      <div className="row" style={{ gap: 8 }}>
        <span className="faint" style={{ fontSize: "var(--fs-cap)" }}>{body.length} / {COMMENT_MAX}</span>
        <span style={{ flex: 1 }} />
        <button type="submit" className="btn btn-primary" disabled={!body.trim() || submitting}>
          <Icon name="send" size={13} />Gönder
        </button>
      </div>
    </form>
  );
}

function AttachmentsList({
  attachments, canUpload, canPostInternal, uploading, onUpload, onDownload
}: {
  attachments: Attachment[];
  canUpload: boolean;
  canPostInternal: boolean;
  uploading: boolean;
  onUpload: (file: File, visibility: Visibility) => void | Promise<void>;
  onDownload: (att: Attachment) => void | Promise<void>;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [visibility, setVisibility] = useState<Visibility>("EXTERNAL");

  if (attachments.length === 0 && !canUpload) {
    return <EmptyState icon="paperclip" title="Ek dosya yok" body="Bu talepte henüz ek bulunmuyor." />;
  }

  return (
    <div className="col gap-3">
      {attachments.length === 0 ? (
        <p className="faint" style={{ fontSize: "var(--fs-sm)" }}>Henüz ek yok.</p>
      ) : (
        attachments.map((a) => (
          <div key={a.id} className="row" style={{ gap: 10, padding: "10px 12px", border: "1px solid var(--border)", borderRadius: "var(--r-md)" }}>
            <div style={{ width: 32, height: 32, borderRadius: "var(--r-sm)", background: "var(--bg-inset)", display: "grid", placeItems: "center", color: "var(--text-secondary)" }}>
              <Icon name="paperclip" size={14} />
            </div>
            <div className="col" style={{ flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: "var(--fs-sm)", fontWeight: 550, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.fileName}</span>
              <span className="faint" style={{ fontSize: "var(--fs-cap)" }}>
                {formatBytes(a.sizeBytes)} · {formatActor(a.uploadedBy)} · {formatRelative(a.uploadedAt)}
                {a.visibility === "INTERNAL" && <> · <VisibilityPill vis="INTERNAL" /></>}
              </span>
            </div>
            <button className="iconbtn" onClick={() => void onDownload(a)} aria-label="İndir"><Icon name="download" size={14} /></button>
          </div>
        ))
      )}
      {canUpload && (
        <div className="row" style={{ gap: 8, paddingTop: 8, borderTop: "1px solid var(--border-faint)" }}>
          {canPostInternal && (
            <div className="seg">
              <button className={visibility === "EXTERNAL" ? "on" : ""} onClick={() => setVisibility("EXTERNAL")}>Genel</button>
              <button className={visibility === "INTERNAL" ? "on" : ""} onClick={() => setVisibility("INTERNAL")}>Dahili</button>
            </div>
          )}
          <button className="btn" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            <Icon name="paperclip" size={13} />{uploading ? "Yükleniyor…" : "Dosya yükle"}
          </button>
          <input ref={fileInputRef} type="file" style={{ display: "none" }} onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void onUpload(f, visibility);
            e.target.value = "";
          }} />
        </div>
      )}
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function ComplaintDialog({ open, submitting, onClose, onSubmit }: {
  open: boolean; submitting: boolean; onClose: () => void;
  onSubmit: (body: string) => void | Promise<void>;
}) {
  const [body, setBody] = useState("");
  useEffect(() => { if (!open) setBody(""); }, [open]);
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Servis Kalitesi Şikayeti"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={submitting}>İptal</Button>
          <Button variant="primary" loading={submitting} disabled={!body.trim() || submitting} onClick={() => onSubmit(body.trim())}>Gönder</Button>
        </>
      }
    >
      <p className="text-muted text-xs" style={{ marginBottom: 8 }}>Şikayetiniz doğrudan yöneticilere iletilecektir.</p>
      <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={5} maxLength={4000} placeholder="Şikayetinizi açıklayın..." />
    </Dialog>
  );
}

function FeedbackDialog({ open, submitting, onClose, onSubmit }: {
  open: boolean; submitting: boolean; onClose: () => void;
  onSubmit: (rating: number, comment: string) => void | Promise<void>;
}) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  useEffect(() => { if (!open) { setRating(5); setComment(""); } }, [open]);
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Geri Bildirim"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={submitting}>İptal</Button>
          <Button variant="primary" loading={submitting} disabled={submitting} onClick={() => onSubmit(rating, comment.trim())}>Gönder</Button>
        </>
      }
    >
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 500 }}>Puanınız</label>
        <div style={{ display: "flex", gap: 4 }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" onClick={() => setRating(n)}
                    style={{ background: "none", border: "none", cursor: "pointer", fontSize: 28, lineHeight: 1, color: n <= rating ? "#f5b400" : "#cbd5e1", padding: 0 }}>
              {n <= rating ? "★" : "☆"}
            </button>
          ))}
        </div>
      </div>
      <Textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={4} maxLength={4000} placeholder="Yorumunuz (opsiyonel)..." />
    </Dialog>
  );
}
