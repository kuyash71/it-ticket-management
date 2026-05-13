import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { http } from "../api/http";
import { useAuth } from "../auth/AuthProvider";
import { useRole } from "../auth/useRole";
import { Button } from "../components/ui/Button";
import { Dialog } from "../components/ui/Dialog";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorBanner } from "../components/ui/ErrorBanner";
import { Field } from "../components/ui/Field";
import { Input, Select, Textarea } from "../components/ui/Input";
import { IconClose, IconInbox, IconPaperclip, IconPlus, IconRefresh, IconSearch } from "../components/ui/Icon";
import { PriorityBadge, StatusBadge, TypeBadge } from "../components/ui/Badge";
import { LoadingState } from "../components/ui/Spinner";
import { useToast } from "../components/ui/Toast";
import { formatRelative } from "../lib/format";
const TITLE_MAX = 255;
const DESC_MAX = 5000;
const STATUS_FILTERS = [
    { value: "ALL", tKey: "ticket.filter.all" },
    { value: "NEW", tKey: "status.new" },
    { value: "IN_PROGRESS", tKey: "status.in_progress" },
    { value: "WAITING_FOR_CUSTOMER", tKey: "status.waiting" },
    { value: "RESOLVED", tKey: "status.resolved" },
    { value: "CLOSED", tKey: "status.closed" }
];
export const TicketsPage = ({ onViewDetail, externalCreateOpen, onCreateOpenChange }) => {
    const { t } = useTranslation();
    const { token } = useAuth();
    const { isCustomer, isManager } = useRole();
    const toast = useToast();
    const [tickets, setTickets] = useState(null);
    const [error, setError] = useState(null);
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [typeFilter, setTypeFilter] = useState("ALL");
    const [search, setSearch] = useState("");
    const fetchTickets = useCallback(async () => {
        setError(null);
        try {
            const res = await http.get("/api/tickets");
            setTickets(res.data);
        }
        catch {
            setError(t("error.fetch_failed"));
            setTickets([]);
        }
    }, [t]);
    useEffect(() => {
        if (!token)
            return;
        void fetchTickets();
    }, [token, fetchTickets]);
    const filtered = useMemo(() => {
        if (!tickets)
            return [];
        const q = search.trim().toLowerCase();
        return tickets.filter((tk) => {
            if (statusFilter !== "ALL" && tk.status !== statusFilter)
                return false;
            if (typeFilter !== "ALL" && tk.type !== typeFilter)
                return false;
            if (q && !tk.title.toLowerCase().includes(q) && !tk.id.toLowerCase().includes(q))
                return false;
            return true;
        });
    }, [tickets, statusFilter, typeFilter, search]);
    const canCreate = !isManager();
    const filtersActive = statusFilter !== "ALL" || typeFilter !== "ALL" || search.length > 0;
    return (_jsxs("div", { className: "page-container", children: [_jsxs("div", { className: "page-header", children: [_jsxs("div", { children: [_jsx("h1", { className: "page-title", children: t("ticket.list") }), _jsx("p", { className: "page-subtitle", children: tickets === null
                                    ? t("app.loading")
                                    : t("ticket.list.subtitle", { count: filtered.length }) })] }), _jsxs("div", { className: "page-actions", children: [_jsx(Button, { variant: "ghost", size: "sm", leadingIcon: _jsx(IconRefresh, {}), onClick: () => void fetchTickets(), children: t("action.refresh") }), canCreate && (_jsx(Button, { variant: "primary", leadingIcon: _jsx(IconPlus, {}), onClick: () => onCreateOpenChange(true), children: t("ticket.create") }))] })] }), error && _jsx("div", { style: { marginBottom: "var(--space-4)" }, children: _jsx(ErrorBanner, { children: error }) }), _jsxs("div", { className: "list-toolbar", children: [_jsx(Input, { type: "search", placeholder: t("ticket.search"), value: search, onChange: (e) => setSearch(e.target.value), leadingIcon: _jsx(IconSearch, {}), "aria-label": t("ticket.search") }), _jsx("div", { className: "filter-chips", role: "tablist", "aria-label": t("ticket.filter.status"), children: STATUS_FILTERS.map((f) => (_jsx("button", { type: "button", role: "tab", className: "filter-chip", "aria-pressed": statusFilter === f.value, onClick: () => setStatusFilter(f.value), children: t(f.tKey) }, f.value))) }), _jsxs(Select, { value: typeFilter, onChange: (e) => setTypeFilter(e.target.value), "aria-label": t("ticket.filter.type"), style: { width: 160 }, children: [_jsx("option", { value: "ALL", children: t("ticket.filter.all_types") }), _jsx("option", { value: "INCIDENT", children: t("ticket.type.incident") }), _jsx("option", { value: "SERVICE_REQUEST", children: t("ticket.type.service_request") })] })] }), tickets === null ? (_jsx("div", { className: "card", children: _jsx(LoadingState, { text: t("app.loading") }) })) : filtered.length === 0 ? (_jsx("div", { className: "card", children: _jsx(EmptyState, { icon: _jsx(IconInbox, { size: 20 }), title: t("ticket.empty"), description: filtersActive ? t("ticket.empty.filtered") : t("ticket.empty.desc"), action: filtersActive ? (_jsx(Button, { variant: "ghost", onClick: () => { setStatusFilter("ALL"); setTypeFilter("ALL"); setSearch(""); }, children: t("ticket.filter.clear") })) : canCreate ? (_jsx(Button, { variant: "primary", leadingIcon: _jsx(IconPlus, {}), onClick: () => onCreateOpenChange(true), children: t("ticket.create") })) : null }) })) : (_jsx("div", { className: "data-table-wrapper", children: _jsxs("table", { className: "data-table", "aria-label": t("ticket.list"), children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { style: { width: "100px" }, children: t("ticket.col.id") }), _jsx("th", { children: t("ticket.col.title") }), _jsx("th", { children: t("ticket.col.type") }), _jsx("th", { children: t("ticket.col.status") }), !isCustomer() && _jsx("th", { children: t("ticket.col.priority") }), _jsx("th", { children: t("ticket.col.updated") })] }) }), _jsx("tbody", { children: filtered.map((tk) => (_jsxs("tr", { tabIndex: 0, onClick: () => onViewDetail(tk.id), onKeyDown: (e) => { if (e.key === "Enter")
                                    onViewDetail(tk.id); }, "aria-label": `${t("ticket.open")}: ${tk.title}`, children: [_jsxs("td", { className: "col-id", children: ["#", tk.id.slice(0, 8)] }), _jsx("td", { className: "col-title", children: tk.title }), _jsx("td", { children: _jsx(TypeBadge, { type: tk.type }) }), _jsx("td", { children: _jsx(StatusBadge, { status: tk.status }) }), !isCustomer() && _jsx("td", { children: _jsx(PriorityBadge, { priority: tk.priority }) }), _jsx("td", { className: "text-muted text-xs", children: formatRelative(tk.updatedAt) })] }, tk.id))) })] }) })), _jsx(CreateTicketDialog, { open: externalCreateOpen, onClose: () => onCreateOpenChange(false), onCreated: (tk) => {
                    setTickets((prev) => prev ? [tk, ...prev] : [tk]);
                    onCreateOpenChange(false);
                    toast.success(t("ticket.create"), `#${tk.id.slice(0, 8)} — ${tk.title}`);
                    onViewDetail(tk.id);
                } })] }));
};
const MAX_FILE_BYTES = 10 * 1024 * 1024; // Doc §7: 10 MB
const CreateTicketDialog = ({ open, onClose, onCreated }) => {
    const { t } = useTranslation();
    const toast = useToast();
    const [type, setType] = useState("INCIDENT");
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [urgency, setUrgency] = useState("LOW");
    const [files, setFiles] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    useEffect(() => {
        if (open) {
            setType("INCIDENT");
            setTitle("");
            setDescription("");
            setUrgency("LOW");
            setFiles([]);
            setError(null);
        }
    }, [open]);
    const onFilesPicked = (e) => {
        const picked = Array.from(e.target.files ?? []);
        const accepted = [];
        for (const f of picked) {
            if (f.size > MAX_FILE_BYTES) {
                toast.error(t("attachment.error.too_large", { name: f.name }));
                continue;
            }
            accepted.push({
                id: crypto.randomUUID(),
                file: f,
                visibility: "EXTERNAL",
            });
        }
        setFiles((prev) => [...prev, ...accepted]);
        e.target.value = ""; // allow re-selecting same file
    };
    const removeFile = (id) => setFiles((prev) => prev.filter((s) => s.id !== id));
    const submit = async (e) => {
        e.preventDefault();
        if (!title.trim() || !description.trim())
            return;
        setSubmitting(true);
        setError(null);
        try {
            const attachments = files.map((s) => ({
                fileName: s.file.name,
                mimeType: s.file.type || "application/octet-stream",
                sizeBytes: s.file.size,
                // No real object store is wired yet; we generate a stable key so the
                // metadata is preserved and a later upload service can map it.
                storageKey: `stage/${s.id}/${s.file.name}`,
                visibility: s.visibility,
            }));
            const payload = {
                type,
                title: title.trim(),
                description: description.trim(),
                urgency,
                attachments: attachments.length > 0 ? attachments : undefined,
            };
            const res = await http.post("/api/tickets", payload);
            onCreated(res.data);
        }
        catch {
            setError(t("error.create_failed"));
            toast.error(t("error.create_failed"));
        }
        finally {
            setSubmitting(false);
        }
    };
    return (_jsx(Dialog, { open: open, onClose: () => { if (!submitting)
            onClose(); }, title: t("ticket.create"), description: t("ticket.create.subtitle"), size: "md", footer: _jsxs(_Fragment, { children: [_jsx(Button, { variant: "ghost", onClick: onClose, disabled: submitting, children: t("action.cancel") }), _jsx(Button, { variant: "primary", onClick: (e) => void submit(e), disabled: submitting || !title.trim() || !description.trim(), loading: submitting, children: t("ticket.create") })] }), children: _jsxs("form", { onSubmit: (e) => void submit(e), style: { display: "flex", flexDirection: "column", gap: "var(--space-4)" }, children: [error && _jsx(ErrorBanner, { children: error }), _jsxs("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }, children: [_jsx(Field, { label: t("ticket.type"), htmlFor: "t-type", required: true, children: _jsxs(Select, { id: "t-type", value: type, onChange: (e) => setType(e.target.value), children: [_jsx("option", { value: "INCIDENT", children: t("ticket.type.incident") }), _jsx("option", { value: "SERVICE_REQUEST", children: t("ticket.type.service_request") })] }) }), _jsx(Field, { label: t("ticket.col.urgency"), htmlFor: "t-urgency", hint: t("ticket.urgency.hint"), children: _jsxs(Select, { id: "t-urgency", value: urgency, onChange: (e) => setUrgency(e.target.value), children: [_jsx("option", { value: "LOW", children: t("urgency.low") }), _jsx("option", { value: "MEDIUM", children: t("urgency.medium") }), _jsx("option", { value: "HIGH", children: t("urgency.high") })] }) })] }), _jsx(Field, { label: t("ticket.title"), htmlFor: "t-title", required: true, hint: `${title.length} / ${TITLE_MAX}`, children: _jsx(Input, { id: "t-title", value: title, onChange: (e) => setTitle(e.target.value), maxLength: TITLE_MAX, placeholder: t("ticket.title.placeholder"), required: true }) }), _jsx(Field, { label: t("ticket.description"), htmlFor: "t-desc", required: true, hint: `${description.length} / ${DESC_MAX}`, children: _jsx(Textarea, { id: "t-desc", value: description, onChange: (e) => setDescription(e.target.value), maxLength: DESC_MAX, rows: 6, placeholder: t("ticket.description.placeholder"), required: true }) }), _jsx(Field, { label: t("attachment.add"), htmlFor: "t-attachments", hint: t("attachment.hint"), children: _jsxs("div", { style: { display: "flex", flexDirection: "column", gap: "var(--space-2)" }, children: [_jsxs("label", { htmlFor: "t-attachments", style: {
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "var(--space-2)",
                                    padding: "var(--space-2) var(--space-3)",
                                    border: "1px dashed var(--border)",
                                    borderRadius: "var(--radius-md)",
                                    cursor: "pointer",
                                    color: "var(--text-secondary)",
                                    fontSize: "var(--text-sm)",
                                    width: "fit-content",
                                }, children: [_jsx(IconPaperclip, { size: 14 }), t("attachment.choose")] }), _jsx("input", { id: "t-attachments", type: "file", multiple: true, onChange: onFilesPicked, style: { display: "none" } }), files.length > 0 && (_jsx("ul", { style: {
                                    listStyle: "none",
                                    padding: 0,
                                    margin: 0,
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "var(--space-1)",
                                }, children: files.map((s) => (_jsxs("li", { style: {
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "var(--space-2)",
                                        padding: "var(--space-2) var(--space-3)",
                                        background: "var(--bg-subtle)",
                                        border: "1px solid var(--border)",
                                        borderRadius: "var(--radius-md)",
                                        fontSize: "var(--text-sm)",
                                    }, children: [_jsx(IconPaperclip, { size: 14, "aria-hidden": true }), _jsx("span", { style: { flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: s.file.name }), _jsx("span", { className: "text-muted text-xs", children: formatBytes(s.file.size) }), _jsx(Button, { type: "button", variant: "ghost", size: "sm", iconOnly: true, leadingIcon: _jsx(IconClose, { size: 14 }), onClick: () => removeFile(s.id), "aria-label": t("attachment.remove") })] }, s.id))) }))] }) })] }) }));
};
function formatBytes(bytes) {
    if (bytes < 1024)
        return `${bytes} B`;
    if (bytes < 1024 * 1024)
        return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
