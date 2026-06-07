import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { http } from "../../api/http";
import { Button } from "../ui/Button";
import { Dialog } from "../ui/Dialog";
import { Field } from "../ui/Field";
import { Select, Textarea } from "../ui/Input";
import type { AgentSummary, ResolutionCode, TicketImpact, TicketStatus, TicketUrgency } from "../../types/api";

const RESOLUTION_CODES: ResolutionCode[] = [
  "FIXED",
  "WORKAROUND",
  "USER_ERROR",
  "CONFIGURATION_CHANGE",
  "KNOWN_ERROR",
  "NOT_REPRODUCIBLE",
  "DUPLICATE",
  "NO_ACTION_REQUIRED",
];

type ResolveDialogProps = {
  open: boolean;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (resolutionNote: string, resolutionCode: ResolutionCode) => void | Promise<void>;
};

/**
 * Doc §4.1 — RESOLVED requires a non-empty resolution note and a resolution code.
 * The submit button stays disabled until both fields are filled.
 */
export const ResolveDialog = ({ open, submitting, onClose, onSubmit }: ResolveDialogProps) => {
  const { t } = useTranslation();
  const [note, setNote] = useState("");
  const [code, setCode] = useState<ResolutionCode | "">("");

  useEffect(() => {
    if (!open) {
      setNote("");
      setCode("");
    }
  }, [open]);

  const trimmed = note.trim();
  const canSubmit = trimmed.length > 0 && code !== "" && !submitting;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t("ticket.resolve.title")}
      description={t("ticket.resolve.description")}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            {t("action.cancel")}
          </Button>
          <Button
            variant="primary"
            onClick={() => void onSubmit(trimmed, code as ResolutionCode)}
            disabled={!canSubmit}
            loading={submitting}
          >
            {t("ticket.resolve.submit")}
          </Button>
        </>
      }
    >
      <Field
        htmlFor="resolve-code"
        label={t("ticket.resolve.code_label")}
        required
      >
        <Select
          id="resolve-code"
          value={code}
          onChange={(e) => setCode(e.target.value as ResolutionCode | "")}
        >
          <option value="">{t("ticket.resolve.code_placeholder")}</option>
          {RESOLUTION_CODES.map((c) => (
            <option key={c} value={c}>
              {t(`resolution_code.${c}`)}
            </option>
          ))}
        </Select>
      </Field>
      <Field
        htmlFor="resolve-note"
        label={t("ticket.resolve.note_label")}
        hint={t("ticket.resolve.note_hint")}
        required
      >
        <Textarea
          id="resolve-note"
          rows={5}
          maxLength={4000}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t("ticket.resolve.note_placeholder")}
        />
      </Field>
    </Dialog>
  );
};

type ConfirmCloseDialogProps = {
  open: boolean;
  submitting: boolean;
  onClose: () => void;
  onSubmit: () => void | Promise<void>;
};

/**
 * Doc §4.1 — Customer confirms closure of a RESOLVED ticket.
 * No reason required; this is the happy path.
 */
export const ConfirmCloseDialog = ({ open, submitting, onClose, onSubmit }: ConfirmCloseDialogProps) => {
  const { t } = useTranslation();
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t("ticket.confirm_close.title")}
      description={t("ticket.confirm_close.description")}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            {t("action.cancel")}
          </Button>
          <Button
            variant="primary"
            onClick={() => void onSubmit()}
            loading={submitting}
          >
            {t("ticket.confirm_close.submit")}
          </Button>
        </>
      }
    >
      <p style={{ color: "var(--text-secondary)", fontSize: "var(--text-sm)", margin: 0 }}>
        {t("ticket.confirm_close.body")}
      </p>
    </Dialog>
  );
};

type ForceCloseDialogProps = {
  open: boolean;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void | Promise<void>;
};

/**
 * Doc §9 — Manager force-close. Reason is mandatory and goes to audit.
 */
export const ForceCloseDialog = ({ open, submitting, onClose, onSubmit }: ForceCloseDialogProps) => {
  const { t } = useTranslation();
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!open) setReason("");
  }, [open]);

  const trimmed = reason.trim();
  const canSubmit = trimmed.length > 0 && !submitting;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t("ticket.force_close.title")}
      description={t("ticket.force_close.description")}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            {t("action.cancel")}
          </Button>
          <Button
            variant="danger"
            onClick={() => void onSubmit(trimmed)}
            disabled={!canSubmit}
            loading={submitting}
          >
            {t("ticket.force_close.submit")}
          </Button>
        </>
      }
    >
      <Field
        htmlFor="force-close-reason"
        label={t("ticket.force_close.reason_label")}
        hint={t("ticket.force_close.reason_hint")}
        required
      >
        <Textarea
          id="force-close-reason"
          autoFocus
          rows={4}
          maxLength={4000}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={t("ticket.force_close.reason_placeholder")}
        />
      </Field>
    </Dialog>
  );
};

type OverrideStatusDialogProps = {
  open: boolean;
  submitting: boolean;
  currentStatus: TicketStatus;
  onClose: () => void;
  onSubmit: (payload: { targetStatus: TicketStatus; reason: string }) => void | Promise<void>;
};

const ALL_STATUSES: TicketStatus[] = ["NEW", "IN_PROGRESS", "WAITING_FOR_CUSTOMER", "RESOLVED", "CLOSED"];
const STATUS_KEY_FOR_DIALOG: Record<TicketStatus, string> = {
  NEW: "status.new",
  IN_PROGRESS: "status.in_progress",
  WAITING_FOR_CUSTOMER: "status.waiting",
  RESOLVED: "status.resolved",
  CLOSED: "status.closed",
};

/**
 * Doc §5.4.3 — Manager-only status override. Reason is mandatory.
 */
export const OverrideStatusDialog = ({
  open,
  submitting,
  currentStatus,
  onClose,
  onSubmit,
}: OverrideStatusDialogProps) => {
  const { t } = useTranslation();
  const eligible = ALL_STATUSES.filter((s) => s !== currentStatus);
  const [target, setTarget] = useState<TicketStatus>(eligible[0] ?? "IN_PROGRESS");
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (open) {
      setTarget(eligible[0] ?? "IN_PROGRESS");
      setReason("");
    }
  }, [open, currentStatus]);

  const trimmed = reason.trim();
  const canSubmit = trimmed.length > 0 && target !== currentStatus && !submitting;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t("ticket.override.title")}
      description={t("ticket.override.description")}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            {t("action.cancel")}
          </Button>
          <Button
            variant="danger"
            onClick={() => void onSubmit({ targetStatus: target, reason: trimmed })}
            disabled={!canSubmit}
            loading={submitting}
          >
            {t("ticket.override.submit")}
          </Button>
        </>
      }
    >
      <Field htmlFor="override-target" label={t("ticket.override.target_label")} required>
        <Select
          id="override-target"
          value={target}
          onChange={(e) => setTarget(e.target.value as TicketStatus)}
        >
          {eligible.map((s) => (
            <option key={s} value={s}>
              {t(STATUS_KEY_FOR_DIALOG[s])}
            </option>
          ))}
        </Select>
      </Field>
      <Field
        htmlFor="override-reason"
        label={t("ticket.override.reason_label")}
        hint={t("ticket.override.reason_hint")}
        required
      >
        <Textarea
          id="override-reason"
          rows={4}
          maxLength={4000}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={t("ticket.override.reason_placeholder")}
        />
      </Field>
    </Dialog>
  );
};

type ReassignDialogProps = {
  open: boolean;
  submitting: boolean;
  currentAssignee: string | null;
  onClose: () => void;
  onSubmit: (payload: { assignee: string; reason: string }) => void | Promise<void>;
};

/**
 * Doc §9 — Manager reassigns the ticket to another agent. Reason zorunlu, audit'e gider.
 * Agent listesi /api/v1/users/agents'tan gelir (auto-populated when agents log in).
 */
export const ReassignDialog = ({
  open,
  submitting,
  currentAssignee,
  onClose,
  onSubmit,
}: ReassignDialogProps) => {
  const { t } = useTranslation();
  const [agents, setAgents] = useState<AgentSummary[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(false);
  const [assignee, setAssignee] = useState<string>("");
  const [reason, setReason] = useState<string>("");

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoadingAgents(true);
    http
      .get<AgentSummary[]>("/api/v1/users/agents")
      .then((res) => {
        if (cancelled) return;
        setAgents(res.data);
        setAssignee(res.data[0]?.username ?? "");
      })
      .catch(() => {
        if (cancelled) return;
        setAgents([]);
      })
      .finally(() => {
        if (cancelled) return;
        setLoadingAgents(false);
      });
    setReason("");
    return () => {
      cancelled = true;
    };
  }, [open]);

  const trimmed = reason.trim();
  const canSubmit =
    trimmed.length > 0 &&
    assignee.length > 0 &&
    assignee !== currentAssignee &&
    !submitting;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t("ticket.reassign.title")}
      description={t("ticket.reassign.description")}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            {t("action.cancel")}
          </Button>
          <Button
            variant="primary"
            onClick={() => void onSubmit({ assignee, reason: trimmed })}
            disabled={!canSubmit}
            loading={submitting}
          >
            {t("ticket.reassign.submit")}
          </Button>
        </>
      }
    >
      <Field
        htmlFor="reassign-assignee"
        label={t("ticket.reassign.assignee_label")}
        hint={
          loadingAgents
            ? t("ticket.reassign.loading_agents")
            : agents.length === 0
              ? t("ticket.reassign.no_agents")
              : t("ticket.reassign.assignee_hint")
        }
        required
      >
        <Select
          id="reassign-assignee"
          value={assignee}
          onChange={(e) => setAssignee(e.target.value)}
          disabled={loadingAgents || agents.length === 0}
        >
          {agents.map((a) => (
            <option key={a.username} value={a.username}>
              {a.displayName} ({a.username}) — {a.role}
            </option>
          ))}
        </Select>
      </Field>
      <Field
        htmlFor="reassign-reason"
        label={t("ticket.reassign.reason_label")}
        hint={t("ticket.reassign.reason_hint")}
        required
      >
        <Textarea
          id="reassign-reason"
          rows={3}
          maxLength={1000}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={t("ticket.reassign.reason_placeholder")}
        />
      </Field>
    </Dialog>
  );
};

type ConfirmResumeDialogProps = {
  open: boolean;
  submitting: boolean;
  onClose: () => void;
  onSubmit: () => void | Promise<void>;
};

export const ConfirmResumeDialog = ({ open, submitting, onClose, onSubmit }: ConfirmResumeDialogProps) => {
  const { t } = useTranslation();
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t("ticket.request_info.confirm_title")}
      description={t("ticket.request_info.confirm_description")}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            {t("action.cancel")}
          </Button>
          <Button variant="primary" onClick={() => void onSubmit()} loading={submitting}>
            {t("ticket.request_info.confirm_submit")}
          </Button>
        </>
      }
    >
      <p style={{ color: "var(--text-secondary)", fontSize: "var(--text-sm)", margin: 0 }}>
        {t("ticket.request_info.confirm_body")}
      </p>
    </Dialog>
  );
};

type ApproveDialogProps = {
  open: boolean;
  submitting: boolean;
  onClose: () => void;
  onSubmit: () => void | Promise<void>;
};

export const ApproveDialog = ({ open, submitting, onClose, onSubmit }: ApproveDialogProps) => {
  const { t } = useTranslation();
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t("approval.approve.title")}
      description={t("approval.approve.description")}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            {t("action.cancel")}
          </Button>
          <Button variant="primary" onClick={() => void onSubmit()} loading={submitting}>
            {t("approval.approve.submit")}
          </Button>
        </>
      }
    >
      <p style={{ color: "var(--text-secondary)", fontSize: "var(--text-sm)", margin: 0 }}>
        {t("approval.approve.body")}
      </p>
    </Dialog>
  );
};

type RejectDialogProps = {
  open: boolean;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void | Promise<void>;
};

export const RejectDialog = ({ open, submitting, onClose, onSubmit }: RejectDialogProps) => {
  const { t } = useTranslation();
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!open) setReason("");
  }, [open]);

  const trimmed = reason.trim();
  const canSubmit = trimmed.length > 0 && !submitting;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t("approval.reject.title")}
      description={t("approval.reject.description")}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            {t("action.cancel")}
          </Button>
          <Button
            variant="danger"
            onClick={() => void onSubmit(trimmed)}
            disabled={!canSubmit}
            loading={submitting}
          >
            {t("approval.reject.submit")}
          </Button>
        </>
      }
    >
      <Field
        htmlFor="reject-reason"
        label={t("approval.reject.reason_label")}
        hint={t("approval.reject.reason_hint")}
        required
      >
        <Textarea
          id="reject-reason"
          autoFocus
          rows={4}
          maxLength={2000}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={t("approval.reject.reason_placeholder")}
        />
      </Field>
    </Dialog>
  );
};

type ChangePriorityDialogProps = {
  open: boolean;
  submitting: boolean;
  currentImpact: TicketImpact;
  currentUrgency: TicketUrgency;
  onClose: () => void;
  onSubmit: (payload: { impact: TicketImpact; urgency: TicketUrgency; reason: string }) => void | Promise<void>;
};

/**
 * Doc §3.2 — Priority change requires reason; audit zorunlu.
 * Backend recalculates priority from (impact, urgency).
 */
export const ChangePriorityDialog = ({
  open,
  submitting,
  currentImpact,
  currentUrgency,
  onClose,
  onSubmit,
}: ChangePriorityDialogProps) => {
  const { t } = useTranslation();
  const [impact, setImpact] = useState<TicketImpact>(currentImpact);
  const [urgency, setUrgency] = useState<TicketUrgency>(currentUrgency);
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (open) {
      setImpact(currentImpact);
      setUrgency(currentUrgency);
      setReason("");
    }
  }, [open, currentImpact, currentUrgency]);

  const trimmed = reason.trim();
  const changed = impact !== currentImpact || urgency !== currentUrgency;
  const canSubmit = trimmed.length > 0 && changed && !submitting;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t("ticket.priority.title")}
      description={t("ticket.priority.description")}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            {t("action.cancel")}
          </Button>
          <Button
            variant="primary"
            onClick={() => void onSubmit({ impact, urgency, reason: trimmed })}
            disabled={!canSubmit}
            loading={submitting}
          >
            {t("ticket.priority.submit")}
          </Button>
        </>
      }
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
        <Field htmlFor="priority-impact" label={t("ticket.col.impact")}>
          <Select
            id="priority-impact"
            value={impact}
            onChange={(e) => setImpact(e.target.value as TicketImpact)}
          >
            <option value="LOW">{t("impact.low")}</option>
            <option value="MEDIUM">{t("impact.medium")}</option>
            <option value="HIGH">{t("impact.high")}</option>
          </Select>
        </Field>
        <Field htmlFor="priority-urgency" label={t("ticket.col.urgency")}>
          <Select
            id="priority-urgency"
            value={urgency}
            onChange={(e) => setUrgency(e.target.value as TicketUrgency)}
          >
            <option value="LOW">{t("urgency.low")}</option>
            <option value="MEDIUM">{t("urgency.medium")}</option>
            <option value="HIGH">{t("urgency.high")}</option>
          </Select>
        </Field>
      </div>
      <Field
        htmlFor="priority-reason"
        label={t("ticket.priority.reason_label")}
        hint={t("ticket.priority.reason_hint")}
        required
      >
        <Textarea
          id="priority-reason"
          rows={3}
          maxLength={1000}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={t("ticket.priority.reason_placeholder")}
        />
      </Field>
    </Dialog>
  );
};
