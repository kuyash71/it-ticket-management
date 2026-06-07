import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useState } from "react";
import { http } from "../api/http";
import { useAuth } from "../auth/AuthProvider";
import { useRole } from "../auth/useRole";
import { Card, EmptyState, ErrorBanner, SkRows } from "../components/itsm/Common";
import { Icon } from "../components/itsm/Icon";
import { Assignee, PriorityPill, SLABar, StatusBadge, TypeBadge } from "../components/itsm/Primitives";
import { STATUS_META, TYPE_META, PRIORITY_META } from "../components/itsm/meta";
import { Dialog } from "../components/ui/Dialog";
import { Button } from "../components/ui/Button";
import { Field } from "../components/ui/Field";
import { Input, Select, Textarea } from "../components/ui/Input";
import { ErrorBanner as ErrorBannerLegacy } from "../components/ui/ErrorBanner";
import { useToast } from "../components/ui/Toast";
import { formatActor, formatRelative } from "../lib/format";
export const TicketsPage = ({ onViewDetail, externalCreateOpen, onCreateOpenChange, initialOvertime }) => {
    const { token } = useAuth();
    const { isCustomer, isManager } = useRole();
    const toast = useToast();
    const [tickets, setTickets] = useState(null);
    const [error, setError] = useState(null);
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [typeFilter, setTypeFilter] = useState("ALL");
    const [priorityFilter, setPriorityFilter] = useState("ALL");
    const [search, setSearch] = useState("");
    const [overtimeOnly, setOvertimeOnly] = useState(!!initialOvertime);
    const fetchTickets = useCallback(async () => {
        setError(null);
        try {
            const url = overtimeOnly && isManager() ? "/api/v1/tickets/overtime" : "/api/v1/tickets";
            const res = await http.get(url);
            setTickets(res.data);
        }
        catch {
            setError("Veriler yüklenemedi.");
            setTickets([]);
        }
    }, [overtimeOnly, isManager]);
    useEffect(() => {
        if (!token)
            return;
        void fetchTickets();
    }, [token, fetchTickets]);
    const filtered = useMemo(() => {
        if (!tickets)
            return [];
        const q = search.trim().toLowerCase();
        return tickets.filter((t) => {
            if (statusFilter !== "ALL" && t.status !== statusFilter)
                return false;
            if (typeFilter !== "ALL" && t.type !== typeFilter)
                return false;
            if (priorityFilter !== "ALL" && t.priority !== priorityFilter)
                return false;
            if (q && !t.title.toLowerCase().includes(q) && !t.id.toLowerCase().includes(q))
                return false;
            return true;
        });
    }, [tickets, statusFilter, typeFilter, priorityFilter, search]);
    // Her rol kendi adına ticket açabilir — backend reporter olarak actor'u kaydeder.
    const canCreate = true;
    const filtersActive = statusFilter !== "ALL" || typeFilter !== "ALL" || priorityFilter !== "ALL" || search.length > 0 || overtimeOnly;
    return (_jsxs("div", { className: "col gap-4", children: [error && _jsx(ErrorBanner, { msg: error, onRetry: () => void fetchTickets() }), _jsxs("div", { className: "row", style: { gap: 10, flexWrap: "wrap" }, children: [_jsxs("div", { className: "search", style: { width: 280 }, children: [_jsx(Icon, { name: "search", size: 14 }), _jsx("input", { type: "search", placeholder: "Talep ara (ba\u015Fl\u0131k, ID)...", value: search, onChange: (e) => setSearch(e.target.value), style: { border: "none", outline: "none", background: "transparent", flex: 1, font: "inherit", color: "var(--text-primary)" } })] }), _jsx(FilterDropdown, { icon: "filter", label: "Durum", value: statusFilter, options: [
                            { v: "ALL", l: "Tümü" },
                            ...Object.keys(STATUS_META).map((k) => ({ v: k, l: STATUS_META[k].label }))
                        ], onChange: (v) => setStatusFilter(v) }), _jsx(FilterDropdown, { icon: "filter", label: "T\u00FCr", value: typeFilter, options: [
                            { v: "ALL", l: "Tümü" },
                            ...Object.keys(TYPE_META).map((k) => ({ v: k, l: TYPE_META[k].label }))
                        ], onChange: (v) => setTypeFilter(v) }), !isCustomer() && (_jsx(FilterDropdown, { icon: "filter", label: "\u00D6ncelik", value: priorityFilter, options: [
                            { v: "ALL", l: "Tümü" },
                            ...Object.keys(PRIORITY_META).map((k) => ({ v: k, l: PRIORITY_META[k].label }))
                        ], onChange: (v) => setPriorityFilter(v) })), isManager() && (_jsxs("span", { className: "chip" + (overtimeOnly ? " on" : ""), onClick: () => setOvertimeOnly((v) => !v), role: "button", tabIndex: 0, style: overtimeOnly ? { borderColor: "color-mix(in srgb, var(--red) 40%, var(--border))", color: "var(--red)" } : undefined, children: [_jsx(Icon, { name: "clock", size: 12 }), "S\u00FCre A\u015F\u0131m\u0131"] })), _jsx("span", { style: { flex: 1 } }), _jsx("span", { className: "faint", style: { fontSize: "var(--fs-cap)" }, children: tickets === null ? "Yükleniyor…" : `${filtered.length} / ${tickets.length}` }), canCreate && (_jsxs("button", { className: "btn btn-primary", onClick: () => onCreateOpenChange(true), children: [_jsx(Icon, { name: "plus", size: 13 }), "Yeni Talep"] }))] }), _jsx(Card, { pad: false, style: { overflow: "hidden" }, children: tickets === null ? _jsx(SkRows, { n: 8 }) : filtered.length === 0 ? (_jsx(EmptyState, { icon: "ticket", title: "E\u015Fle\u015Fen talep bulunamad\u0131", body: filtersActive ? "Filtreleri temizleyin veya farklı bir arama deneyin." : "Henüz talep yok.", action: filtersActive ? (_jsx("button", { className: "btn btn-sm", onClick: () => { setStatusFilter("ALL"); setTypeFilter("ALL"); setPriorityFilter("ALL"); setSearch(""); setOvertimeOnly(false); }, children: "Filtreleri s\u0131f\u0131rla" })) : canCreate ? (_jsxs("button", { className: "btn btn-primary btn-sm", onClick: () => onCreateOpenChange(true), children: [_jsx(Icon, { name: "plus", size: 13 }), "Yeni Talep"] })) : undefined })) : (_jsxs("table", { className: "tbl", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "ID" }), _jsx("th", { children: "Ba\u015Fl\u0131k" }), _jsx("th", { children: "T\u00FCr" }), _jsx("th", { children: "Durum" }), !isCustomer() && _jsx("th", { children: "\u00D6ncelik" }), !isCustomer() && _jsx("th", { children: "Atanan" }), _jsx("th", { style: { width: 170 }, children: "SLA" }), _jsx("th", { className: "right", children: "G\u00FCncellendi" })] }) }), _jsx("tbody", { children: filtered.map((t) => (_jsxs("tr", { onClick: () => onViewDetail(t.id), tabIndex: 0, onKeyDown: (e) => { if (e.key === "Enter")
                                    onViewDetail(t.id); }, children: [_jsxs("td", { className: "col-id", children: ["#", t.id.slice(0, 8)] }), _jsx("td", { className: "ttl", style: { maxWidth: 380 }, children: _jsx("div", { style: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: t.title }) }), _jsx("td", { children: _jsx(TypeBadge, { type: t.type }) }), _jsx("td", { children: _jsx(StatusBadge, { status: t.status }) }), !isCustomer() && _jsx("td", { children: _jsx(PriorityPill, { priority: t.priority }) }), !isCustomer() && (_jsx("td", { children: t.assigneeId
                                            ? _jsx(Assignee, { id: t.assigneeId, name: formatActor(t.assigneeId) })
                                            : _jsx("span", { className: "faint", style: { fontSize: "var(--fs-cap)" }, children: "\u2014" }) })), _jsx("td", { children: t.sla ? _jsx(SLABar, { sla: t.sla }) : _jsx("span", { className: "faint", style: { fontSize: "var(--fs-cap)" }, children: "\u2014" }) }), _jsx("td", { className: "faint nowrap right", children: formatRelative(t.updatedAt) })] }, t.id))) })] })) }), _jsx(CreateTicketDialog, { open: externalCreateOpen, onClose: () => onCreateOpenChange(false), onCreated: (t) => {
                    setTickets((prev) => prev ? [t, ...prev] : [t]);
                    onCreateOpenChange(false);
                    toast.success("Talep oluşturuldu", `#${t.id.slice(0, 8)} — ${t.title}`);
                    onViewDetail(t.id);
                } })] }));
};
function FilterDropdown({ icon, label, value, options, onChange }) {
    const current = options.find((o) => o.v === value)?.l ?? label;
    const [open, setOpen] = useState(false);
    return (_jsxs("div", { style: { position: "relative" }, children: [_jsxs("span", { className: "chip" + (value !== "ALL" ? " on" : ""), onClick: () => setOpen((o) => !o), role: "button", tabIndex: 0, children: [_jsx(Icon, { name: icon, size: 12 }), label, ": ", _jsx("b", { style: { marginLeft: 4 }, children: current }), _jsx(Icon, { name: "chevdown", size: 11 })] }), open && (_jsxs(_Fragment, { children: [_jsx("div", { style: { position: "fixed", inset: 0, zIndex: 50 }, onClick: () => setOpen(false) }), _jsx("div", { className: "card", style: { position: "absolute", top: "100%", left: 0, marginTop: 4, minWidth: 180, padding: 4, zIndex: 51, boxShadow: "var(--shadow-pop)" }, children: options.map((o) => (_jsx("div", { onClick: () => { onChange(o.v); setOpen(false); }, style: {
                                padding: "6px 10px",
                                borderRadius: 4,
                                cursor: "pointer",
                                fontSize: "var(--fs-sm)",
                                background: value === o.v ? "var(--accent-soft)" : "transparent",
                                color: value === o.v ? "var(--accent-text)" : "var(--text-primary)"
                            }, children: o.l }, o.v))) })] }))] }));
}
const TITLE_MAX = 255;
const DESC_MAX = 5000;
const MAX_FILE_BYTES = 10 * 1024 * 1024;
function CreateTicketDialog({ open, onClose, onCreated }) {
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
                toast.error(`${f.name}: dosya çok büyük (max 10 MB)`);
                continue;
            }
            accepted.push({ id: crypto.randomUUID(), file: f, visibility: "EXTERNAL" });
        }
        setFiles((prev) => [...prev, ...accepted]);
        e.target.value = "";
    };
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
                storageKey: `stage/${s.id}/${s.file.name}`,
                visibility: s.visibility
            }));
            const payload = {
                type,
                title: title.trim(),
                description: description.trim(),
                urgency,
                attachments: attachments.length > 0 ? attachments : undefined
            };
            const res = await http.post("/api/v1/tickets", payload);
            onCreated(res.data);
        }
        catch {
            setError("Talep oluşturulamadı.");
            toast.error("Talep oluşturulamadı");
        }
        finally {
            setSubmitting(false);
        }
    };
    return (_jsx(Dialog, { open: open, onClose: () => { if (!submitting)
            onClose(); }, title: "Yeni Talep Olu\u015Ftur", description: "Sorununuzu detayl\u0131 bir \u015Fekilde anlat\u0131n, ekibimiz size h\u0131zl\u0131ca d\u00F6n\u00FC\u015F yapacak.", size: "md", footer: _jsxs(_Fragment, { children: [_jsx(Button, { variant: "ghost", onClick: onClose, disabled: submitting, children: "\u0130ptal" }), _jsx(Button, { variant: "primary", onClick: (e) => void submit(e), disabled: submitting || !title.trim() || !description.trim(), loading: submitting, children: "Talep Olu\u015Ftur" })] }), children: _jsxs("form", { onSubmit: (e) => void submit(e), style: { display: "flex", flexDirection: "column", gap: 16 }, children: [error && _jsx(ErrorBannerLegacy, { children: error }), _jsxs("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }, children: [_jsx(Field, { label: "T\u00FCr", htmlFor: "t-type", required: true, children: _jsxs(Select, { id: "t-type", value: type, onChange: (e) => setType(e.target.value), children: [_jsx("option", { value: "INCIDENT", children: "Olay" }), _jsx("option", { value: "SERVICE_REQUEST", children: "Hizmet Talebi" })] }) }), _jsx(Field, { label: "Aciliyet", htmlFor: "t-urgency", hint: "D\u00FC\u015F\u00FCk/Orta/Y\u00FCksek", children: _jsxs(Select, { id: "t-urgency", value: urgency, onChange: (e) => setUrgency(e.target.value), children: [_jsx("option", { value: "LOW", children: "D\u00FC\u015F\u00FCk" }), _jsx("option", { value: "MEDIUM", children: "Orta" }), _jsx("option", { value: "HIGH", children: "Y\u00FCksek" })] }) })] }), _jsx(Field, { label: "Ba\u015Fl\u0131k", htmlFor: "t-title", required: true, hint: `${title.length} / ${TITLE_MAX}`, children: _jsx(Input, { id: "t-title", value: title, onChange: (e) => setTitle(e.target.value), maxLength: TITLE_MAX, placeholder: "K\u0131sa ve a\u00E7\u0131klay\u0131c\u0131 bir ba\u015Fl\u0131k", required: true }) }), _jsx(Field, { label: "A\u00E7\u0131klama", htmlFor: "t-desc", required: true, hint: `${description.length} / ${DESC_MAX}`, children: _jsx(Textarea, { id: "t-desc", value: description, onChange: (e) => setDescription(e.target.value), maxLength: DESC_MAX, rows: 6, placeholder: "Sorunu ad\u0131m ad\u0131m anlat\u0131n", required: true }) }), _jsx(Field, { label: "Ekler", htmlFor: "t-attachments", hint: "Max 10 MB / dosya", children: _jsxs("div", { style: { display: "flex", flexDirection: "column", gap: 8 }, children: [_jsxs("label", { htmlFor: "t-attachments", style: { display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 12px", border: "1px dashed var(--border)", borderRadius: 6, cursor: "pointer", color: "var(--text-secondary)", fontSize: 13, width: "fit-content" }, children: [_jsx(Icon, { name: "paperclip", size: 14 }), "Dosya se\u00E7"] }), _jsx("input", { id: "t-attachments", type: "file", multiple: true, onChange: onFilesPicked, style: { display: "none" } }), files.length > 0 && (_jsx("ul", { style: { listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 4 }, children: files.map((s) => (_jsxs("li", { style: { display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: "var(--bg-subtle)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 13 }, children: [_jsx(Icon, { name: "paperclip", size: 14 }), _jsx("span", { style: { flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: s.file.name }), _jsx("span", { className: "faint", style: { fontSize: 11 }, children: formatBytes(s.file.size) }), _jsx("button", { type: "button", className: "iconbtn", onClick: () => setFiles((p) => p.filter((x) => x.id !== s.id)), children: _jsx(Icon, { name: "x", size: 12 }) })] }, s.id))) }))] }) })] }) }));
}
function formatBytes(bytes) {
    if (bytes < 1024)
        return `${bytes} B`;
    if (bytes < 1024 * 1024)
        return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
