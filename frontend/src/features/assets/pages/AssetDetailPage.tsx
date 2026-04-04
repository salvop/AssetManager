import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";

import {
  assignAsset,
  changeAssetLocation,
  changeAssetStatus,
  deleteDocument,
  downloadDocument,
  fetchDocumentBlob,
  returnAsset,
  uploadAssetDocument,
} from "../../../api/assets";
import { createMaintenanceTicket } from "../../../api/maintenance";
import type { AssetEvent } from "../../../types/api";
import { useAsset } from "../hooks/useAssets";
import { useAssetMaintenance } from "../hooks/useAssetMaintenance";
import { useLookupsBundle } from "../../../hooks/useLookups";

const inputClassName =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm outline-none transition focus:border-brand-300 focus:ring-4 focus:ring-brand-100";

export function AssetDetailPage() {
  const params = useParams();
  const assetId = Number(params.assetId);
  const queryClient = useQueryClient();
  const { data: asset, isLoading, error } = useAsset(assetId);
  const { data: maintenanceTickets } = useAssetMaintenance(assetId);
  const { employees, statuses, locations, departments, isLoading: areLookupsLoading } = useLookupsBundle({
    departments: true,
    locations: true,
    statuses: true,
    employees: true,
    vendors: false,
    categories: false,
    models: false,
    users: false,
  });
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [selectedStatusId, setSelectedStatusId] = useState("");
  const [selectedLocationId, setSelectedLocationId] = useState("");
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
  const [ticketTitle, setTicketTitle] = useState("");
  const [ticketDescription, setTicketDescription] = useState("");
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    let objectUrl: string | null = null;

    async function loadPhotoPreview() {
      if (!asset?.photo_document) {
        setPhotoPreviewUrl(null);
        return;
      }
      try {
        const { blob } = await fetchDocumentBlob(asset.photo_document.id);
        objectUrl = window.URL.createObjectURL(blob);
        if (isMounted) {
          setPhotoPreviewUrl(objectUrl);
        }
      } catch {
        if (isMounted) {
          setPhotoPreviewUrl(null);
        }
      }
    }

    void loadPhotoPreview();
    return () => {
      isMounted = false;
      if (objectUrl) {
        window.URL.revokeObjectURL(objectUrl);
      }
    };
  }, [asset?.photo_document]);

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["asset", assetId] });
    await queryClient.invalidateQueries({ queryKey: ["assets"] });
    await queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    await queryClient.invalidateQueries({ queryKey: ["maintenance-tickets"] });
    await queryClient.invalidateQueries({ queryKey: ["maintenance-tickets", "asset", assetId] });
  };

  const assignMutation = useMutation({
    mutationFn: () =>
      assignAsset(assetId, {
        employee_id: Number(selectedEmployeeId),
        department_id: selectedDepartmentId ? Number(selectedDepartmentId) : null,
        location_id: selectedLocationId ? Number(selectedLocationId) : null,
      }),
    onSuccess: invalidate,
  });

  const returnMutation = useMutation({
    mutationFn: () => returnAsset(assetId, {}),
    onSuccess: invalidate,
  });

  const statusMutation = useMutation({
    mutationFn: () => changeAssetStatus(assetId, { status_id: Number(selectedStatusId) }),
    onSuccess: invalidate,
  });

  const locationMutation = useMutation({
    mutationFn: () => changeAssetLocation(assetId, { location_id: selectedLocationId ? Number(selectedLocationId) : null }),
    onSuccess: invalidate,
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadAssetDocument(assetId, file),
    onSuccess: invalidate,
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: (documentId: number) => deleteDocument(documentId),
    onSuccess: invalidate,
  });

  const downloadDocumentMutation = useMutation({
    mutationFn: (documentId: number) => downloadDocument(documentId),
  });

  const maintenanceMutation = useMutation({
    mutationFn: () =>
      createMaintenanceTicket({
        asset_id: assetId,
        title: ticketTitle,
        description: ticketDescription || null,
      }),
    onSuccess: async () => {
      setTicketTitle("");
      setTicketDescription("");
      await invalidate();
    },
  });

  if (isLoading) return <p className="text-sm text-slate-500">Caricamento dettaglio asset…</p>;
  if (error || !asset) return <p className="text-sm text-rose-600">{error?.message ?? "Asset non trovato"}</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-700">Dettaglio asset</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{asset.name}</h2>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-slate-500">
              <span>{asset.asset_tag}</span>
              <span className="text-slate-300">•</span>
              <span>{asset.status.name}</span>
              {asset.location?.name && (
                <>
                  <span className="text-slate-300">•</span>
                  <span>{asset.location.name}</span>
                </>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to={`/assets/${asset.id}/edit`}
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Modifica asset
            </Link>
            <Link
              to={`/assets/${asset.id}/assignments`}
              className="rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-900"
            >
              Storico assegnazioni
            </Link>
          </div>
      </div>
      <div className="grid gap-3 md:grid-cols-4">
          <HeroStat label="Stato" value={asset.status.name} />
          <HeroStat label="Assegnato a" value={asset.assigned_employee?.full_name ?? "Non assegnato"} />
          <HeroStat label="Cost center" value={asset.cost_center ?? "-"} />
          <HeroStat label="Garanzia" value={asset.warranty_expiry_date ?? "-"} />
      </div>

      <section className="app-panel">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Attivita</p>
          <h3 className="mt-2 text-lg font-semibold text-slate-900">Cosa puoi fare su questo asset</h3>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <ActionShortcut
            to="#assignment-workflow"
            title="Assegna asset"
            description="Consegna il bene a un utente o reparto."
          />
          <ActionShortcut
            to="#assignment-workflow"
            title="Registra rientro"
            description="Chiudi l'assegnazione attiva e rendilo disponibile."
          />
          <ActionShortcut
            to="#maintenance-workflow"
            title="Apri ticket"
            description="Avvia una lavorazione di manutenzione."
          />
          <ActionShortcut
            to="#operational-workflow"
            title="Cambia stato"
            description="Aggiorna stato e collocazione operativa."
          />
          <ActionShortcut
            to={`/assets/${asset.id}/edit`}
            title="Aggiorna anagrafica"
            description="Modifica dati, lifecycle e dismissione."
          />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <section className="space-y-6">
          <Panel title="Panoramica">
            <InfoGrid
              items={[
                ["Tipo", asset.asset_type ?? "-"],
                ["Marca", asset.brand ?? "-"],
                ["Categoria", asset.category.name],
                ["Modello", asset.model?.name ?? "-"],
                ["Sede", asset.location?.name ?? "-"],
                ["Piano", asset.location_floor ?? "-"],
                ["Stanza", asset.location_room ?? "-"],
                ["Rack", asset.location_rack ?? "-"],
                ["Slot", asset.location_slot ?? "-"],
                ["Dipartimento", asset.current_department?.name ?? "-"],
                ["Fornitore", asset.vendor?.name ?? "-"],
                ["Cost center", asset.cost_center ?? "-"],
                ["Assegnato a", asset.assigned_employee?.full_name ?? "-"],
                ["Numero seriale", asset.serial_number ?? "-"],
                ["Data acquisto", asset.purchase_date ?? "-"],
                ["Scadenza garanzia", asset.warranty_expiry_date ?? "-"],
                ["Fine vita prevista", asset.expected_end_of_life_date ?? "-"],
                ["Data dismissione", asset.disposal_date ?? "-"],
              ]}
            />
            {asset.description && <p className="mt-4 text-sm leading-6 text-slate-600">{asset.description}</p>}
          </Panel>

          <Panel title="Foto asset">
            {asset.photo_document && photoPreviewUrl ? (
              <div className="space-y-4">
                <img
                  src={photoPreviewUrl}
                  alt={`Foto ${asset.name}`}
                  width={1280}
                  height={720}
                  className="max-h-80 w-full rounded-2xl border border-slate-200 object-cover"
                />
                <div className="flex items-center justify-between text-sm text-slate-500">
                  <span>{asset.photo_document.file_name}</span>
                  <button
                    onClick={() => downloadDocumentMutation.mutate(asset.photo_document!.id)}
                    className="font-medium text-brand-700"
                  >
                    Scarica foto
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">Nessuna foto dedicata disponibile. Carica un documento immagine per vedere l’anteprima asset.</p>
            )}
          </Panel>

          <Panel title="Storico eventi">
            <div className="space-y-3">
              {asset.events.length === 0 && <p className="text-sm text-slate-500">Nessun evento registrato.</p>}
              {asset.events.map((event) => (
                <EventTimelineItem key={event.id} event={event} />
              ))}
            </div>
          </Panel>

          <Panel title="Documenti">
            <label className="mb-4 block rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-4 text-sm text-slate-600">
              Carica un PDF, un'immagine o un file di testo
              <input
                type="file"
                className="mt-3 block"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) uploadMutation.mutate(file);
                }}
              />
            </label>
            <div className="space-y-2">
              {asset.documents.length === 0 && <p className="text-sm text-slate-500">Nessun documento caricato.</p>}
              {asset.documents.map((document) => (
                <div
                  key={document.id}
                  className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white/85 p-3 text-sm"
                >
                  <div>
                    <p className="font-medium text-slate-900">{document.file_name}</p>
                    <p className="text-slate-500">
                      {document.content_type} · {Math.round(document.size_bytes / 1024)} KB
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500">{new Date(document.created_at).toLocaleDateString()}</span>
                    <button
                      onClick={() => downloadDocumentMutation.mutate(document.id)}
                      className="text-sm font-medium text-brand-700"
                    >
                      Scarica
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Confermi l'eliminazione del documento "${document.file_name}"?`)) {
                          deleteDocumentMutation.mutate(document.id);
                        }
                      }}
                      className="text-sm font-medium text-rose-600"
                    >
                      Elimina
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {(uploadMutation.error || deleteDocumentMutation.error || downloadDocumentMutation.error) && (
              <p className="mt-3 text-sm text-rose-600" aria-live="polite">
                {String(
                  uploadMutation.error?.message ||
                    deleteDocumentMutation.error?.message ||
                    downloadDocumentMutation.error?.message,
                )}
              </p>
            )}
          </Panel>

          <Panel title="Ticket di manutenzione" id="maintenance-workflow">
            <div className="space-y-3">
              <input
                value={ticketTitle}
                onChange={(event) => setTicketTitle(event.target.value)}
                placeholder="Titolo ticket"
                className={inputClassName}
              />
              <textarea
                value={ticketDescription}
                onChange={(event) => setTicketDescription(event.target.value)}
                placeholder="Descrivi il problema"
                className={`${inputClassName} min-h-24`}
              />
              <button
                disabled={!ticketTitle || maintenanceMutation.isPending}
                onClick={() => maintenanceMutation.mutate()}
                className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-900 disabled:opacity-50"
              >
                {maintenanceMutation.isPending ? "Apertura…" : "Apri ticket di manutenzione"}
              </button>
            </div>

            <div className="mt-5 space-y-2">
              {(maintenanceTickets?.items ?? []).length === 0 && (
                <p className="text-sm text-slate-500">Nessun ticket di manutenzione collegato a questo asset.</p>
              )}
              {(maintenanceTickets?.items ?? []).map((ticket) => (
                <Link
                  key={ticket.id}
                  to={`/maintenance-tickets/${ticket.id}`}
                  className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white/85 p-3 text-sm transition hover:-translate-y-0.5 hover:border-brand-200 hover:bg-white"
                >
                  <div>
                    <p className="font-medium text-slate-900">{ticket.title}</p>
                    <p className="text-slate-500">{ticket.status}</p>
                  </div>
                  <span className="text-slate-500">{new Date(ticket.opened_at).toLocaleDateString()}</span>
                </Link>
              ))}
            </div>
          </Panel>
        </section>

        <section className="space-y-6">
          <Panel title="Assegna asset" id="assignment-workflow">
            <div className="space-y-3">
              <select value={selectedEmployeeId} onChange={(event) => setSelectedEmployeeId(event.target.value)} className={inputClassName}>
                <option value="">Seleziona assegnatario</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.full_name}
                  </option>
                ))}
              </select>
              <select value={selectedDepartmentId} onChange={(event) => setSelectedDepartmentId(event.target.value)} className={inputClassName}>
                <option value="">Dipartimento</option>
                {departments.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
              <select value={selectedLocationId} onChange={(event) => setSelectedLocationId(event.target.value)} className={inputClassName}>
                <option value="">Sede</option>
                {locations.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
              <button
                disabled={!selectedEmployeeId || assignMutation.isPending || areLookupsLoading}
                onClick={() => assignMutation.mutate()}
                className="w-full rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-900 disabled:opacity-50"
              >
                {assignMutation.isPending ? "Assegnazione..." : "Assegna asset"}
              </button>
              {asset.assigned_employee && (
                <button
                  onClick={() => returnMutation.mutate()}
                  className="w-full rounded-full border border-slate-300 px-4 py-2 text-sm font-medium transition hover:bg-slate-50"
                >
                  {returnMutation.isPending ? "Rientro…" : "Registra rientro"}
                </button>
              )}
            </div>
          </Panel>

          <Panel title="Modifiche operative" id="operational-workflow">
            <div className="space-y-3">
              <select value={selectedStatusId} onChange={(event) => setSelectedStatusId(event.target.value)} className={inputClassName}>
                <option value="">Cambia stato</option>
                {statuses.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
              <button
                disabled={!selectedStatusId || statusMutation.isPending}
                onClick={() => statusMutation.mutate()}
                className="w-full rounded-full border border-slate-300 px-4 py-2 text-sm font-medium transition hover:bg-slate-50 disabled:opacity-50"
              >
                Applica stato
              </button>

              <select value={selectedLocationId} onChange={(event) => setSelectedLocationId(event.target.value)} className={inputClassName}>
                <option value="">Sposta asset</option>
                {locations.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
              <button
                disabled={locationMutation.isPending}
                onClick={() => locationMutation.mutate()}
                className="w-full rounded-full border border-slate-300 px-4 py-2 text-sm font-medium transition hover:bg-slate-50"
              >
                Applica sede
              </button>
            </div>
          </Panel>
        </section>
      </div>
    </div>
  );
}

function Panel({ title, children, id }: { title: string; children: ReactNode; id?: string }) {
  return (
    <section id={id} className="app-panel scroll-mt-6">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Modulo operativo</p>
        <h3 className="mt-2 text-lg font-semibold text-slate-900">{title}</h3>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function ActionShortcut({ to, title, description }: { to: string; title: string; description: string }) {
  const isAnchor = to.startsWith("#");
  const className =
    "rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 transition hover:bg-white";

  if (isAnchor) {
    return (
      <a href={to} className={className}>
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <p className="mt-2 text-xs leading-5 text-slate-500">{description}</p>
      </a>
    );
  }

  return (
    <Link to={to} className={className}>
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-2 text-xs leading-5 text-slate-500">{description}</p>
    </Link>
  );
}

function InfoGrid({ items }: { items: Array<[string, string]> }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {items.map(([label, value]) => (
        <div key={label}>
          <p className="text-xs uppercase tracking-[0.15em] text-slate-500">{label}</p>
          <p className="mt-1 text-sm text-slate-900">{value}</p>
        </div>
      ))}
    </div>
  );
}

function EventTimelineItem({ event }: { event: AssetEvent }) {
  const meta = getEventPresentation(event);
  const performedBy = event.performed_by_user?.full_name ?? "Sistema";
  const createdAt = new Date(event.created_at).toLocaleString();

  return (
    <div className="relative rounded-2xl border border-slate-200/80 bg-white/85 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className={["mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold", meta.tone].join(" ")}>
            {meta.label}
          </span>
          <div>
            <p className="font-medium text-slate-900">{meta.title}</p>
            <p className="mt-1 text-sm text-slate-500">
              {performedBy} · {createdAt}
            </p>
          </div>
        </div>
        <span className="text-[11px] uppercase tracking-[0.15em] text-slate-400">{event.event_type}</span>
      </div>
      {meta.rows.length > 0 && (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {meta.rows.map((row) => (
            <div key={`${event.id}-${row.label}`} className="rounded-xl bg-slate-50 px-3 py-2">
              <p className="text-[11px] uppercase tracking-[0.15em] text-slate-500">{row.label}</p>
              <p className="mt-1 text-sm text-slate-800">{row.value}</p>
            </div>
          ))}
        </div>
      )}
      {meta.note && <p className="mt-4 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">{meta.note}</p>}
    </div>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function getEventPresentation(event: AssetEvent): {
  label: string;
  title: string;
  tone: string;
  rows: Array<{ label: string; value: string }>;
  note?: string;
} {
  const details = event.details ?? {};
  const note = getString(details.notes);

  switch (event.event_type) {
    case "CREATE":
      return {
        label: "Creazione",
        title: "Asset registrato nel sistema",
        tone: "bg-emerald-100 text-emerald-800",
        rows: buildRows([["Tag asset", getString(details.asset_tag)]]),
      };
    case "UPDATE":
      return {
        label: "Aggiornamento",
        title: "Anagrafica asset aggiornata",
        tone: "bg-sky-100 text-sky-800",
        rows: buildRows([
          ["Stato modificato", boolToItalian(getBoolean(details.status_changed))],
          ["Sede modificata", boolToItalian(getBoolean(details.location_changed))],
        ]),
      };
    case "ASSIGN":
      return {
        label: "Assegnazione",
        title: event.summary,
        tone: "bg-blue-100 text-blue-800",
        rows: buildRows([
          ["Assegnatario", getString(details.assigned_employee_name)],
          ["ID assegnatario", getNumber(details.assigned_employee_id)?.toString()],
        ]),
        note,
      };
    case "RETURN":
      return {
        label: "Rientro",
        title: "Asset rientrato in disponibilita",
        tone: "bg-indigo-100 text-indigo-800",
        rows: [],
        note,
      };
    case "STATUS_CHANGE":
      return {
        label: "Cambio stato",
        title: "Stato asset aggiornato",
        tone: "bg-amber-100 text-amber-800",
        rows: buildRows([
          ["Da", getString(details.from_status)],
          ["A", getString(details.to_status) ?? getString(details.status)],
        ]),
        note,
      };
    case "LOCATION_CHANGE":
      return {
        label: "Cambio sede",
        title: "Collocazione asset aggiornata",
        tone: "bg-violet-100 text-violet-800",
        rows: buildRows([
          ["Da", getString(details.from_location)],
          ["A", getString(details.to_location)],
        ]),
        note,
      };
    case "MAINTENANCE_OPEN":
      return {
        label: "Manutenzione",
        title: event.summary,
        tone: "bg-rose-100 text-rose-800",
        rows: buildRows([["Ticket", getNumber(details.ticket_id)?.toString()]]),
      };
    case "MAINTENANCE_STATUS_CHANGE":
      return {
        label: "Manutenzione",
        title: "Stato ticket manutenzione aggiornato",
        tone: "bg-rose-100 text-rose-800",
        rows: buildRows([
          ["Ticket", getNumber(details.ticket_id)?.toString()],
          ["Nuovo stato", getString(details.status)],
        ]),
      };
    case "DISPOSAL_RECORDED":
      return {
        label: "Dismissione",
        title: "Data di dismissione registrata",
        tone: "bg-slate-200 text-slate-700",
        rows: buildRows([["Data dismissione", getString(details.disposal_date)]]),
      };
    default:
      return {
        label: "Evento",
        title: event.summary,
        tone: "bg-slate-100 text-slate-700",
        rows: buildRows(Object.entries(details).map(([key, value]) => [humanizeKey(key), formatUnknown(value)])),
      };
  }
}

function buildRows(entries: Array<[string, string | undefined]>): Array<{ label: string; value: string }> {
  return entries
    .filter(([, value]) => value && value !== "null")
    .map(([label, value]) => ({ label, value: value ?? "-" }));
}

function boolToItalian(value?: boolean): string | undefined {
  if (value === undefined) return undefined;
  return value ? "Si" : "No";
}

function humanizeKey(value: string): string {
  return value.replace(/_/g, " ");
}

function formatUnknown(value: unknown): string {
  if (value === null || value === undefined) return "-";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
}

function getString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function getNumber(value: unknown): number | undefined {
  return typeof value === "number" ? value : undefined;
}

function getBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}
