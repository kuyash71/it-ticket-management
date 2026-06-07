import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";

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
import type {
  AttachmentInput,
  CreateTicketPayload,
  Ticket,
  TicketStatus,
  TicketType,
  TicketUrgency
} from "../types/api";

type Props = {
  onViewDetail: (id: string) => void;
  externalCreateOpen: boolean;
  onCreateOpenChange: (open: boolean) => void;
  initialOvertime?: boolean;
};

export const TicketsPage = ({ onViewDetail, externalCreateOpen, onCreateOpenChange, initialOvertime }: Props) => {
  const { token } = useAuth();
  const { isCustomer, isManager } = useRole();
  const toast = useToast();

  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "ALL">("ALL");
  const [typeFilter, setTypeFilter] = useState<TicketType | "ALL">("ALL");
  const [priorityFilter, setPriorityFilter] = useState<keyof typeof PRIORITY_META | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [overtimeOnly, setOvertimeOnly] = useState(!!initialOvertime);

  const fetchTickets = useCallback(async () => {
    setError(null);
    try {
      const url = overtimeOnly && isManager() ? "/api/v1/tickets/overtime" : "/api/v1/tickets";
      const res = await http.get<Ticket[]>(url);
      setTickets(res.data);
    } catch {
      setError("Veriler yüklenemedi.");
      setTickets([]);
    }
  }, [overtimeOnly, isManager]);

  useEffect(() => {
    if (!token) return;
    void fetchTickets();
  }, [token, fetchTickets]);

  const filtered = useMemo(() => {
    if (!tickets) return [];
    const q = search.trim().toLowerCase();
    return tickets.filter((t) => {
      if (statusFilter !== "ALL" && t.status !== statusFilter) return false;
      if (typeFilter !== "ALL" && t.type !== typeFilter) return false;
      if (priorityFilter !== "ALL" && t.priority !== priorityFilter) return false;
      if (q && !t.title.toLowerCase().includes(q) && !t.id.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [tickets, statusFilter, typeFilter, priorityFilter, search]);

  // Her rol kendi adına ticket açabilir — backend reporter olarak actor'u kaydeder.
  const canCreate = true;
  const filtersActive = statusFilter !== "ALL" || typeFilter !== "ALL" || priorityFilter !== "ALL" || search.length > 0 || overtimeOnly;

  return (
    <div className="col gap-4">
      {error && <ErrorBanner msg={error} onRetry={() => void fetchTickets()} />}

      <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
        <div className="search" style={{ width: 280 }}>
          <Icon name="search" size={14} />
          <input
            type="search"
            placeholder="Talep ara (başlık, ID)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ border: "none", outline: "none", background: "transparent", flex: 1, font: "inherit", color: "var(--text-primary)" }}
          />
        </div>

        <FilterDropdown
          icon="filter"
          label="Durum"
          value={statusFilter}
          options={[
            { v: "ALL", l: "Tümü" },
            ...(Object.keys(STATUS_META) as TicketStatus[]).map((k) => ({ v: k, l: STATUS_META[k].label }))
          ]}
          onChange={(v) => setStatusFilter(v as TicketStatus | "ALL")}
        />

        <FilterDropdown
          icon="filter"
          label="Tür"
          value={typeFilter}
          options={[
            { v: "ALL", l: "Tümü" },
            ...(Object.keys(TYPE_META) as TicketType[]).map((k) => ({ v: k, l: TYPE_META[k].label }))
          ]}
          onChange={(v) => setTypeFilter(v as TicketType | "ALL")}
        />

        {!isCustomer() && (
          <FilterDropdown
            icon="filter"
            label="Öncelik"
            value={priorityFilter}
            options={[
              { v: "ALL", l: "Tümü" },
              ...(Object.keys(PRIORITY_META) as (keyof typeof PRIORITY_META)[]).map((k) => ({ v: k, l: PRIORITY_META[k].label }))
            ]}
            onChange={(v) => setPriorityFilter(v as keyof typeof PRIORITY_META | "ALL")}
          />
        )}

        {isManager() && (
          <span
            className={"chip" + (overtimeOnly ? " on" : "")}
            onClick={() => setOvertimeOnly((v) => !v)}
            role="button"
            tabIndex={0}
            style={overtimeOnly ? { borderColor: "color-mix(in srgb, var(--red) 40%, var(--border))", color: "var(--red)" } : undefined}
          >
            <Icon name="clock" size={12} />Süre Aşımı
          </span>
        )}

        <span style={{ flex: 1 }} />

        <span className="faint" style={{ fontSize: "var(--fs-cap)" }}>
          {tickets === null ? "Yükleniyor…" : `${filtered.length} / ${tickets.length}`}
        </span>

        {canCreate && (
          <button className="btn btn-primary" onClick={() => onCreateOpenChange(true)}>
            <Icon name="plus" size={13} />Yeni Talep
          </button>
        )}
      </div>

      <Card pad={false} style={{ overflow: "hidden" }}>
        {tickets === null ? <SkRows n={8} /> : filtered.length === 0 ? (
          <EmptyState
            icon="ticket"
            title="Eşleşen talep bulunamadı"
            body={filtersActive ? "Filtreleri temizleyin veya farklı bir arama deneyin." : "Henüz talep yok."}
            action={filtersActive ? (
              <button className="btn btn-sm" onClick={() => { setStatusFilter("ALL"); setTypeFilter("ALL"); setPriorityFilter("ALL"); setSearch(""); setOvertimeOnly(false); }}>
                Filtreleri sıfırla
              </button>
            ) : canCreate ? (
              <button className="btn btn-primary btn-sm" onClick={() => onCreateOpenChange(true)}><Icon name="plus" size={13} />Yeni Talep</button>
            ) : undefined}
          />
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th>ID</th>
                <th>Başlık</th>
                <th>Tür</th>
                <th>Durum</th>
                {!isCustomer() && <th>Öncelik</th>}
                {!isCustomer() && <th>Atanan</th>}
                <th style={{ width: 170 }}>SLA</th>
                <th className="right">Güncellendi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id} onClick={() => onViewDetail(t.id)} tabIndex={0}
                    onKeyDown={(e) => { if (e.key === "Enter") onViewDetail(t.id); }}>
                  <td className="col-id">#{t.id.slice(0, 8)}</td>
                  <td className="ttl" style={{ maxWidth: 380 }}>
                    <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</div>
                  </td>
                  <td><TypeBadge type={t.type} /></td>
                  <td><StatusBadge status={t.status} /></td>
                  {!isCustomer() && <td><PriorityPill priority={t.priority} /></td>}
                  {!isCustomer() && (
                    <td>
                      {t.assigneeId
                        ? <Assignee id={t.assigneeId} name={formatActor(t.assigneeId)} />
                        : <span className="faint" style={{ fontSize: "var(--fs-cap)" }}>—</span>}
                    </td>
                  )}
                  <td>{t.sla ? <SLABar sla={t.sla} /> : <span className="faint" style={{ fontSize: "var(--fs-cap)" }}>—</span>}</td>
                  <td className="faint nowrap right">{formatRelative(t.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <CreateTicketDialog
        open={externalCreateOpen}
        onClose={() => onCreateOpenChange(false)}
        onCreated={(t) => {
          setTickets((prev) => prev ? [t, ...prev] : [t]);
          onCreateOpenChange(false);
          toast.success("Talep oluşturuldu", `#${t.id.slice(0, 8)} — ${t.title}`);
          onViewDetail(t.id);
        }}
      />
    </div>
  );
};

function FilterDropdown({ icon, label, value, options, onChange }: {
  icon: string;
  label: string;
  value: string;
  options: { v: string; l: string }[];
  onChange: (v: string) => void;
}) {
  const current = options.find((o) => o.v === value)?.l ?? label;
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <span className={"chip" + (value !== "ALL" ? " on" : "")} onClick={() => setOpen((o) => !o)} role="button" tabIndex={0}>
        <Icon name={icon as any} size={12} />{label}: <b style={{ marginLeft: 4 }}>{current}</b>
        <Icon name="chevdown" size={11} />
      </span>
      {open && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 50 }} onClick={() => setOpen(false)} />
          <div className="card" style={{ position: "absolute", top: "100%", left: 0, marginTop: 4, minWidth: 180, padding: 4, zIndex: 51, boxShadow: "var(--shadow-pop)" }}>
            {options.map((o) => (
              <div
                key={o.v}
                onClick={() => { onChange(o.v); setOpen(false); }}
                style={{
                  padding: "6px 10px",
                  borderRadius: 4,
                  cursor: "pointer",
                  fontSize: "var(--fs-sm)",
                  background: value === o.v ? "var(--accent-soft)" : "transparent",
                  color: value === o.v ? "var(--accent-text)" : "var(--text-primary)"
                }}
              >
                {o.l}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const TITLE_MAX = 255;
const DESC_MAX = 5000;
const MAX_FILE_BYTES = 10 * 1024 * 1024;

type StagedFile = { id: string; file: File; visibility: "EXTERNAL" | "INTERNAL" };

function CreateTicketDialog({
  open, onClose, onCreated
}: { open: boolean; onClose: () => void; onCreated: (t: Ticket) => void }) {
  const toast = useToast();
  const [type, setType] = useState<TicketType>("INCIDENT");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [urgency, setUrgency] = useState<TicketUrgency>("LOW");
  const [files, setFiles] = useState<StagedFile[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) { setType("INCIDENT"); setTitle(""); setDescription(""); setUrgency("LOW"); setFiles([]); setError(null); }
  }, [open]);

  const onFilesPicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    const accepted: StagedFile[] = [];
    for (const f of picked) {
      if (f.size > MAX_FILE_BYTES) { toast.error(`${f.name}: dosya çok büyük (max 10 MB)`); continue; }
      accepted.push({ id: crypto.randomUUID(), file: f, visibility: "EXTERNAL" });
    }
    setFiles((prev) => [...prev, ...accepted]);
    e.target.value = "";
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const attachments: AttachmentInput[] = files.map((s) => ({
        fileName: s.file.name,
        mimeType: s.file.type || "application/octet-stream",
        sizeBytes: s.file.size,
        storageKey: `stage/${s.id}/${s.file.name}`,
        visibility: s.visibility
      }));
      const payload: CreateTicketPayload = {
        type,
        title: title.trim(),
        description: description.trim(),
        urgency,
        attachments: attachments.length > 0 ? attachments : undefined
      };
      const res = await http.post<Ticket>("/api/v1/tickets", payload);
      onCreated(res.data);
    } catch {
      setError("Talep oluşturulamadı.");
      toast.error("Talep oluşturulamadı");
    } finally { setSubmitting(false); }
  };

  return (
    <Dialog
      open={open}
      onClose={() => { if (!submitting) onClose(); }}
      title="Yeni Talep Oluştur"
      description="Sorununuzu detaylı bir şekilde anlatın, ekibimiz size hızlıca dönüş yapacak."
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={submitting}>İptal</Button>
          <Button variant="primary" onClick={(e) => void submit(e as unknown as FormEvent)} disabled={submitting || !title.trim() || !description.trim()} loading={submitting}>
            Talep Oluştur
          </Button>
        </>
      }
    >
      <form onSubmit={(e) => void submit(e)} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {error && <ErrorBannerLegacy>{error}</ErrorBannerLegacy>}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Tür" htmlFor="t-type" required>
            <Select id="t-type" value={type} onChange={(e) => setType(e.target.value as TicketType)}>
              <option value="INCIDENT">Olay</option>
              <option value="SERVICE_REQUEST">Hizmet Talebi</option>
            </Select>
          </Field>
          <Field label="Aciliyet" htmlFor="t-urgency" hint="Düşük/Orta/Yüksek">
            <Select id="t-urgency" value={urgency} onChange={(e) => setUrgency(e.target.value as TicketUrgency)}>
              <option value="LOW">Düşük</option>
              <option value="MEDIUM">Orta</option>
              <option value="HIGH">Yüksek</option>
            </Select>
          </Field>
        </div>
        <Field label="Başlık" htmlFor="t-title" required hint={`${title.length} / ${TITLE_MAX}`}>
          <Input id="t-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={TITLE_MAX} placeholder="Kısa ve açıklayıcı bir başlık" required />
        </Field>
        <Field label="Açıklama" htmlFor="t-desc" required hint={`${description.length} / ${DESC_MAX}`}>
          <Textarea id="t-desc" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={DESC_MAX} rows={6} placeholder="Sorunu adım adım anlatın" required />
        </Field>
        <Field label="Ekler" htmlFor="t-attachments" hint="Max 10 MB / dosya">
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <label htmlFor="t-attachments" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 12px", border: "1px dashed var(--border)", borderRadius: 6, cursor: "pointer", color: "var(--text-secondary)", fontSize: 13, width: "fit-content" }}>
              <Icon name="paperclip" size={14} />Dosya seç
            </label>
            <input id="t-attachments" type="file" multiple onChange={onFilesPicked} style={{ display: "none" }} />
            {files.length > 0 && (
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 4 }}>
                {files.map((s) => (
                  <li key={s.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: "var(--bg-subtle)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 13 }}>
                    <Icon name="paperclip" size={14} />
                    <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.file.name}</span>
                    <span className="faint" style={{ fontSize: 11 }}>{formatBytes(s.file.size)}</span>
                    <button type="button" className="iconbtn" onClick={() => setFiles((p) => p.filter((x) => x.id !== s.id))}>
                      <Icon name="x" size={12} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Field>
      </form>
    </Dialog>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
