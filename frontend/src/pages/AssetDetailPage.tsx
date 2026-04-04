import type { ReactNode } from "react";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";

import { assignAsset, changeAssetLocation, changeAssetStatus, deleteDocument, downloadDocument, returnAsset, uploadAssetDocument } from "../api/assets";
import { createMaintenanceTicket } from "../api/maintenance";
import { useAsset } from "../hooks/useAssets";
import { useAssetMaintenance } from "../hooks/useAssetMaintenance";
import { useLookupsBundle } from "../hooks/useLookups";

const inputClassName = "w-full rounded-md border border-slate-300 px-3 py-2";

export function AssetDetailPage() {
  const params = useParams();
  const assetId = Number(params.assetId);
  const queryClient = useQueryClient();
  const { data: asset, isLoading, error } = useAsset(assetId);
  const { data: maintenanceTickets } = useAssetMaintenance(assetId);
  const { users, statuses, locations, departments, isLoading: areLookupsLoading } = useLookupsBundle();
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedStatusId, setSelectedStatusId] = useState("");
  const [selectedLocationId, setSelectedLocationId] = useState("");
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
  const [ticketTitle, setTicketTitle] = useState("");
  const [ticketDescription, setTicketDescription] = useState("");

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
        user_id: Number(selectedUserId),
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

  if (isLoading) return <p className="text-sm text-slate-500">Caricamento dettaglio asset...</p>;
  if (error || !asset) return <p className="text-sm text-rose-600">{error?.message ?? "Asset non trovato"}</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-700">Dettaglio asset</p>
          <h2 className="mt-2 text-3xl font-semibold">{asset.name}</h2>
          <p className="mt-2 text-sm text-slate-500">
            {asset.asset_tag} · {asset.status.name}
          </p>
        </div>
        <div className="flex gap-3">
          <Link to={`/assets/${asset.id}/edit`} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium">
            Modifica asset
          </Link>
          <Link to={`/assets/${asset.id}/assignments`} className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white">
            Storico assegnazioni
          </Link>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <section className="space-y-6">
          <Panel title="Panoramica">
            <InfoGrid
              items={[
                ["Categoria", asset.category.name],
                ["Modello", asset.model?.name ?? "-"],
                ["Sede", asset.location?.name ?? "-"],
                ["Dipartimento", asset.current_department?.name ?? "-"],
                ["Fornitore", asset.vendor?.name ?? "-"],
                ["Assegnato a", asset.assigned_user?.full_name ?? "-"],
                ["Numero seriale", asset.serial_number ?? "-"],
                ["Data acquisto", asset.purchase_date ?? "-"],
              ]}
            />
            {asset.description && <p className="mt-4 text-sm text-slate-600">{asset.description}</p>}
          </Panel>

          <Panel title="Storico eventi">
            <div className="space-y-3">
              {asset.events.length === 0 && <p className="text-sm text-slate-500">Nessun evento registrato.</p>}
              {asset.events.map((event) => (
                <div key={event.id} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-slate-900">{event.summary}</p>
                    <span className="text-xs uppercase tracking-[0.15em] text-slate-500">{event.event_type}</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    {event.performed_by_user?.full_name ?? "Sistema"} · {new Date(event.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Documenti">
            <label className="mb-4 block rounded-md border border-dashed border-slate-300 p-4 text-sm text-slate-600">
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
                <div key={document.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-3 text-sm">
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
                      onClick={() => deleteDocumentMutation.mutate(document.id)}
                      className="text-sm font-medium text-rose-600"
                    >
                      Elimina
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {(uploadMutation.error || deleteDocumentMutation.error || downloadDocumentMutation.error) && (
              <p className="mt-3 text-sm text-rose-600">
                {String(uploadMutation.error?.message || deleteDocumentMutation.error?.message || downloadDocumentMutation.error?.message)}
              </p>
            )}
          </Panel>

          <Panel title="Ticket di manutenzione">
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
                className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {maintenanceMutation.isPending ? "Apertura..." : "Apri ticket di manutenzione"}
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
                  className="flex items-center justify-between rounded-lg border border-slate-200 p-3 text-sm hover:bg-slate-50"
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
          <Panel title="Assegna asset">
            <div className="space-y-3">
              <select value={selectedUserId} onChange={(event) => setSelectedUserId(event.target.value)} className={inputClassName}>
                <option value="">Seleziona utente</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.full_name}
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
                disabled={!selectedUserId || assignMutation.isPending || areLookupsLoading}
                onClick={() => assignMutation.mutate()}
                className="w-full rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {assignMutation.isPending ? "Assegnazione..." : "Assegna asset"}
              </button>
              {asset.assigned_user && (
                <button
                  onClick={() => returnMutation.mutate()}
                  className="w-full rounded-md border border-slate-300 px-4 py-2 text-sm font-medium"
                >
                  {returnMutation.isPending ? "Rientro..." : "Registra rientro"}
                </button>
              )}
            </div>
          </Panel>

          <Panel title="Modifiche operative">
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
                className="w-full rounded-md border border-slate-300 px-4 py-2 text-sm font-medium disabled:opacity-50"
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
                className="w-full rounded-md border border-slate-300 px-4 py-2 text-sm font-medium"
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

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <div className="mt-4">{children}</div>
    </section>
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
