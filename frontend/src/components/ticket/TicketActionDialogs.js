import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { http } from "../../api/http";
import { Button } from "../ui/Button";
import { Dialog } from "../ui/Dialog";
import { Field } from "../ui/Field";
import { Select, Textarea } from "../ui/Input";
const RESOLUTION_CODES = [
    "FIXED",
    "WORKAROUND",
    "USER_ERROR",
    "CONFIGURATION_CHANGE",
    "KNOWN_ERROR",
    "NOT_REPRODUCIBLE",
    "DUPLICATE",
    "NO_ACTION_REQUIRED",
];
/**
 * Doc §4.1 — RESOLVED requires a non-empty resolution note and a resolution code.
 * The submit button stays disabled until both fields are filled.
 */
export const ResolveDialog = ({ open, submitting, onClose, onSubmit }) => {
    const { t } = useTranslation();
    const [note, setNote] = useState("");
    const [code, setCode] = useState("");
    useEffect(() => {
        if (!open) {
            setNote("");
            setCode("");
        }
    }, [open]);
    const trimmed = note.trim();
    const canSubmit = trimmed.length > 0 && code !== "" && !submitting;
    return (_jsxs(Dialog, { open: open, onClose: onClose, title: t("ticket.resolve.title"), description: t("ticket.resolve.description"), footer: _jsxs(_Fragment, { children: [_jsx(Button, { variant: "ghost", onClick: onClose, disabled: submitting, children: t("action.cancel") }), _jsx(Button, { variant: "primary", onClick: () => void onSubmit(trimmed, code), disabled: !canSubmit, loading: submitting, children: t("ticket.resolve.submit") })] }), children: [_jsx(Field, { htmlFor: "resolve-code", label: t("ticket.resolve.code_label"), required: true, children: _jsxs(Select, { id: "resolve-code", value: code, onChange: (e) => setCode(e.target.value), children: [_jsx("option", { value: "", children: t("ticket.resolve.code_placeholder") }), RESOLUTION_CODES.map((c) => (_jsx("option", { value: c, children: t(`resolution_code.${c}`) }, c)))] }) }), _jsx(Field, { htmlFor: "resolve-note", label: t("ticket.resolve.note_label"), hint: t("ticket.resolve.note_hint"), required: true, children: _jsx(Textarea, { id: "resolve-note", rows: 5, maxLength: 4000, value: note, onChange: (e) => setNote(e.target.value), placeholder: t("ticket.resolve.note_placeholder") }) })] }));
};
/**
 * Doc §4.1 — Customer confirms closure of a RESOLVED ticket.
 * No reason required; this is the happy path.
 */
export const ConfirmCloseDialog = ({ open, submitting, onClose, onSubmit }) => {
    const { t } = useTranslation();
    return (_jsx(Dialog, { open: open, onClose: onClose, title: t("ticket.confirm_close.title"), description: t("ticket.confirm_close.description"), footer: _jsxs(_Fragment, { children: [_jsx(Button, { variant: "ghost", onClick: onClose, disabled: submitting, children: t("action.cancel") }), _jsx(Button, { variant: "primary", onClick: () => void onSubmit(), loading: submitting, children: t("ticket.confirm_close.submit") })] }), children: _jsx("p", { style: { color: "var(--text-secondary)", fontSize: "var(--text-sm)", margin: 0 }, children: t("ticket.confirm_close.body") }) }));
};
/**
 * Doc §9 — Manager force-close. Reason is mandatory and goes to audit.
 */
export const ForceCloseDialog = ({ open, submitting, onClose, onSubmit }) => {
    const { t } = useTranslation();
    const [reason, setReason] = useState("");
    useEffect(() => {
        if (!open)
            setReason("");
    }, [open]);
    const trimmed = reason.trim();
    const canSubmit = trimmed.length > 0 && !submitting;
    return (_jsx(Dialog, { open: open, onClose: onClose, title: t("ticket.force_close.title"), description: t("ticket.force_close.description"), footer: _jsxs(_Fragment, { children: [_jsx(Button, { variant: "ghost", onClick: onClose, disabled: submitting, children: t("action.cancel") }), _jsx(Button, { variant: "danger", onClick: () => void onSubmit(trimmed), disabled: !canSubmit, loading: submitting, children: t("ticket.force_close.submit") })] }), children: _jsx(Field, { htmlFor: "force-close-reason", label: t("ticket.force_close.reason_label"), hint: t("ticket.force_close.reason_hint"), required: true, children: _jsx(Textarea, { id: "force-close-reason", autoFocus: true, rows: 4, maxLength: 4000, value: reason, onChange: (e) => setReason(e.target.value), placeholder: t("ticket.force_close.reason_placeholder") }) }) }));
};
const ALL_STATUSES = ["NEW", "IN_PROGRESS", "WAITING_FOR_CUSTOMER", "RESOLVED", "CLOSED"];
const STATUS_KEY_FOR_DIALOG = {
    NEW: "status.new",
    IN_PROGRESS: "status.in_progress",
    WAITING_FOR_CUSTOMER: "status.waiting",
    RESOLVED: "status.resolved",
    CLOSED: "status.closed",
};
/**
 * Doc §5.4.3 — Manager-only status override. Reason is mandatory.
 */
export const OverrideStatusDialog = ({ open, submitting, currentStatus, onClose, onSubmit, }) => {
    const { t } = useTranslation();
    const eligible = ALL_STATUSES.filter((s) => s !== currentStatus);
    const [target, setTarget] = useState(eligible[0] ?? "IN_PROGRESS");
    const [reason, setReason] = useState("");
    useEffect(() => {
        if (open) {
            setTarget(eligible[0] ?? "IN_PROGRESS");
            setReason("");
        }
    }, [open, currentStatus]);
    const trimmed = reason.trim();
    const canSubmit = trimmed.length > 0 && target !== currentStatus && !submitting;
    return (_jsxs(Dialog, { open: open, onClose: onClose, title: t("ticket.override.title"), description: t("ticket.override.description"), footer: _jsxs(_Fragment, { children: [_jsx(Button, { variant: "ghost", onClick: onClose, disabled: submitting, children: t("action.cancel") }), _jsx(Button, { variant: "danger", onClick: () => void onSubmit({ targetStatus: target, reason: trimmed }), disabled: !canSubmit, loading: submitting, children: t("ticket.override.submit") })] }), children: [_jsx(Field, { htmlFor: "override-target", label: t("ticket.override.target_label"), required: true, children: _jsx(Select, { id: "override-target", value: target, onChange: (e) => setTarget(e.target.value), children: eligible.map((s) => (_jsx("option", { value: s, children: t(STATUS_KEY_FOR_DIALOG[s]) }, s))) }) }), _jsx(Field, { htmlFor: "override-reason", label: t("ticket.override.reason_label"), hint: t("ticket.override.reason_hint"), required: true, children: _jsx(Textarea, { id: "override-reason", rows: 4, maxLength: 4000, value: reason, onChange: (e) => setReason(e.target.value), placeholder: t("ticket.override.reason_placeholder") }) })] }));
};
/**
 * Doc §9 — Manager reassigns the ticket to another agent. Reason zorunlu, audit'e gider.
 * Agent listesi /api/v1/users/agents'tan gelir (auto-populated when agents log in).
 */
export const ReassignDialog = ({ open, submitting, currentAssignee, onClose, onSubmit, }) => {
    const { t } = useTranslation();
    const [agents, setAgents] = useState([]);
    const [loadingAgents, setLoadingAgents] = useState(false);
    const [assignee, setAssignee] = useState("");
    const [reason, setReason] = useState("");
    useEffect(() => {
        if (!open)
            return;
        let cancelled = false;
        setLoadingAgents(true);
        http
            .get("/api/v1/users/agents")
            .then((res) => {
            if (cancelled)
                return;
            setAgents(res.data);
            setAssignee(res.data[0]?.username ?? "");
        })
            .catch(() => {
            if (cancelled)
                return;
            setAgents([]);
        })
            .finally(() => {
            if (cancelled)
                return;
            setLoadingAgents(false);
        });
        setReason("");
        return () => {
            cancelled = true;
        };
    }, [open]);
    const trimmed = reason.trim();
    const canSubmit = trimmed.length > 0 &&
        assignee.length > 0 &&
        assignee !== currentAssignee &&
        !submitting;
    return (_jsxs(Dialog, { open: open, onClose: onClose, title: t("ticket.reassign.title"), description: t("ticket.reassign.description"), footer: _jsxs(_Fragment, { children: [_jsx(Button, { variant: "ghost", onClick: onClose, disabled: submitting, children: t("action.cancel") }), _jsx(Button, { variant: "primary", onClick: () => void onSubmit({ assignee, reason: trimmed }), disabled: !canSubmit, loading: submitting, children: t("ticket.reassign.submit") })] }), children: [_jsx(Field, { htmlFor: "reassign-assignee", label: t("ticket.reassign.assignee_label"), hint: loadingAgents
                    ? t("ticket.reassign.loading_agents")
                    : agents.length === 0
                        ? t("ticket.reassign.no_agents")
                        : t("ticket.reassign.assignee_hint"), required: true, children: _jsx(Select, { id: "reassign-assignee", value: assignee, onChange: (e) => setAssignee(e.target.value), disabled: loadingAgents || agents.length === 0, children: agents.map((a) => (_jsxs("option", { value: a.username, children: [a.displayName, " (", a.username, ") \u2014 ", a.role] }, a.username))) }) }), _jsx(Field, { htmlFor: "reassign-reason", label: t("ticket.reassign.reason_label"), hint: t("ticket.reassign.reason_hint"), required: true, children: _jsx(Textarea, { id: "reassign-reason", rows: 3, maxLength: 1000, value: reason, onChange: (e) => setReason(e.target.value), placeholder: t("ticket.reassign.reason_placeholder") }) })] }));
};
export const ConfirmResumeDialog = ({ open, submitting, onClose, onSubmit }) => {
    const { t } = useTranslation();
    return (_jsx(Dialog, { open: open, onClose: onClose, title: t("ticket.request_info.confirm_title"), description: t("ticket.request_info.confirm_description"), footer: _jsxs(_Fragment, { children: [_jsx(Button, { variant: "ghost", onClick: onClose, disabled: submitting, children: t("action.cancel") }), _jsx(Button, { variant: "primary", onClick: () => void onSubmit(), loading: submitting, children: t("ticket.request_info.confirm_submit") })] }), children: _jsx("p", { style: { color: "var(--text-secondary)", fontSize: "var(--text-sm)", margin: 0 }, children: t("ticket.request_info.confirm_body") }) }));
};
export const ApproveDialog = ({ open, submitting, onClose, onSubmit }) => {
    const { t } = useTranslation();
    return (_jsx(Dialog, { open: open, onClose: onClose, title: t("approval.approve.title"), description: t("approval.approve.description"), footer: _jsxs(_Fragment, { children: [_jsx(Button, { variant: "ghost", onClick: onClose, disabled: submitting, children: t("action.cancel") }), _jsx(Button, { variant: "primary", onClick: () => void onSubmit(), loading: submitting, children: t("approval.approve.submit") })] }), children: _jsx("p", { style: { color: "var(--text-secondary)", fontSize: "var(--text-sm)", margin: 0 }, children: t("approval.approve.body") }) }));
};
export const RejectDialog = ({ open, submitting, onClose, onSubmit }) => {
    const { t } = useTranslation();
    const [reason, setReason] = useState("");
    useEffect(() => {
        if (!open)
            setReason("");
    }, [open]);
    const trimmed = reason.trim();
    const canSubmit = trimmed.length > 0 && !submitting;
    return (_jsx(Dialog, { open: open, onClose: onClose, title: t("approval.reject.title"), description: t("approval.reject.description"), footer: _jsxs(_Fragment, { children: [_jsx(Button, { variant: "ghost", onClick: onClose, disabled: submitting, children: t("action.cancel") }), _jsx(Button, { variant: "danger", onClick: () => void onSubmit(trimmed), disabled: !canSubmit, loading: submitting, children: t("approval.reject.submit") })] }), children: _jsx(Field, { htmlFor: "reject-reason", label: t("approval.reject.reason_label"), hint: t("approval.reject.reason_hint"), required: true, children: _jsx(Textarea, { id: "reject-reason", autoFocus: true, rows: 4, maxLength: 2000, value: reason, onChange: (e) => setReason(e.target.value), placeholder: t("approval.reject.reason_placeholder") }) }) }));
};
/**
 * Doc §3.2 — Priority change requires reason; audit zorunlu.
 * Backend recalculates priority from (impact, urgency).
 */
export const ChangePriorityDialog = ({ open, submitting, currentImpact, currentUrgency, onClose, onSubmit, }) => {
    const { t } = useTranslation();
    const [impact, setImpact] = useState(currentImpact);
    const [urgency, setUrgency] = useState(currentUrgency);
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
    return (_jsxs(Dialog, { open: open, onClose: onClose, title: t("ticket.priority.title"), description: t("ticket.priority.description"), footer: _jsxs(_Fragment, { children: [_jsx(Button, { variant: "ghost", onClick: onClose, disabled: submitting, children: t("action.cancel") }), _jsx(Button, { variant: "primary", onClick: () => void onSubmit({ impact, urgency, reason: trimmed }), disabled: !canSubmit, loading: submitting, children: t("ticket.priority.submit") })] }), children: [_jsxs("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }, children: [_jsx(Field, { htmlFor: "priority-impact", label: t("ticket.col.impact"), children: _jsxs(Select, { id: "priority-impact", value: impact, onChange: (e) => setImpact(e.target.value), children: [_jsx("option", { value: "LOW", children: t("impact.low") }), _jsx("option", { value: "MEDIUM", children: t("impact.medium") }), _jsx("option", { value: "HIGH", children: t("impact.high") })] }) }), _jsx(Field, { htmlFor: "priority-urgency", label: t("ticket.col.urgency"), children: _jsxs(Select, { id: "priority-urgency", value: urgency, onChange: (e) => setUrgency(e.target.value), children: [_jsx("option", { value: "LOW", children: t("urgency.low") }), _jsx("option", { value: "MEDIUM", children: t("urgency.medium") }), _jsx("option", { value: "HIGH", children: t("urgency.high") })] }) })] }), _jsx(Field, { htmlFor: "priority-reason", label: t("ticket.priority.reason_label"), hint: t("ticket.priority.reason_hint"), required: true, children: _jsx(Textarea, { id: "priority-reason", rows: 3, maxLength: 1000, value: reason, onChange: (e) => setReason(e.target.value), placeholder: t("ticket.priority.reason_placeholder") }) })] }));
};
