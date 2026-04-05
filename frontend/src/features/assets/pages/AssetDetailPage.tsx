import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import type { ComponentType, SVGProps } from "react";

import {
  assignAsset,
  changeAssetLocation,
  changeAssetStatus,
  deleteDocument,
  downloadDocument,
  fetchDocumentBlob,
  returnAsset,
  uploadAssetDocument,
} from "@/features/assets/api/assets";
import { createMaintenanceTicket } from "@/features/maintenance/api/maintenance";
import { useAssetMaintenance } from "@/features/assets/hooks/useAssetMaintenance";
import { useAsset } from "@/features/assets/hooks/useAssets";
import { useLookupsBundle } from "@/features/lookups/hooks/useLookups";
import type { AssetEvent } from "@/types/api";
import { PageHeader } from "@/components/layout/page-header";
import { Panel } from "@/components/layout/panel";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { AssetIcon, MaintenanceIcon, PeopleIcon, PlusIcon, SettingsIcon } from "@/components/ui/icons";
import { Input } from "@/components/ui/input";
import { SelectField } from "@/components/ui/select-field";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

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
  const [selectedAssignmentLocationId, setSelectedAssignmentLocationId] = useState("");
  const [selectedRelocationLocationId, setSelectedRelocationLocationId] = useState("");
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
  const [ticketTitle, setTicketTitle] = useState("");
  const [ticketDescription, setTicketDescription] = useState("");
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [pendingDeleteDocument, setPendingDeleteDocument] = useState<{ id: number; fileName: string } | null>(null);

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
        location_id: selectedAssignmentLocationId ? Number(selectedAssignmentLocationId) : null,
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
    mutationFn: () =>
      changeAssetLocation(assetId, {
        location_id: selectedRelocationLocationId ? Number(selectedRelocationLocationId) : null,
      }),
    onSuccess: invalidate,
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadAssetDocument(assetId, file),
    onSuccess: invalidate,
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: (documentId: number) => deleteDocument(documentId),
    onSuccess: async () => {
      setPendingDeleteDocument(null);
      await invalidate();
    },
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

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-10 w-80 rounded-xl" />
        <div className="grid gap-4 md:grid-cols-4">
          <Skeleton className="h-24 rounded-md" />
          <Skeleton className="h-24 rounded-md" />
          <Skeleton className="h-24 rounded-md" />
          <Skeleton className="h-24 rounded-md" />
        </div>
        <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
          <Skeleton className="h-96 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !asset) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Asset non disponibile</AlertTitle>
        <AlertDescription>{error?.message ?? "Asset non trovato"}</AlertDescription>
      </Alert>
    );
  }

  const isAssignmentBlockedByStatus = asset.status.code === "RETIRED" || asset.status.code === "DISPOSED";
  const isAlreadyAssigned = Boolean(asset.assigned_employee);
  const canAssign =
    !areLookupsLoading &&
    !assignMutation.isPending &&
    !isAssignmentBlockedByStatus &&
    !isAlreadyAssigned &&
    Boolean(selectedEmployeeId);
  const isStatusUnchanged = selectedStatusId ? Number(selectedStatusId) === asset.status.id : false;
  const canApplyStatus = Boolean(selectedStatusId) && !isStatusUnchanged && !statusMutation.isPending;
  const currentLocationId = asset.location?.id ?? null;
  const selectedRelocationId = selectedRelocationLocationId ? Number(selectedRelocationLocationId) : null;
  const isLocationUnchanged = selectedRelocationId === currentLocationId;
  const canApplyLocation = !locationMutation.isPending && !isLocationUnchanged;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Dettaglio asset"
        title={asset.name}
        description={`${asset.asset_tag} · ${asset.status.name}${asset.location?.name ? ` · ${asset.location.name}` : ""}`}
        actions={(
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <Link to={`/assets/${asset.id}/edit`}>Modifica asset</Link>
            </Button>
            <Button asChild>
              <Link to={`/assets/${asset.id}/assignments`}>Storico assegnazioni</Link>
            </Button>
          </div>
        )}
      />

      <div className="grid gap-3 md:grid-cols-4">
        <HeroStat label="Stato" value={asset.status.name} />
        <HeroStat label="Assegnato a" value={asset.assigned_employee?.full_name ?? "Non assegnato"} />
        <HeroStat label="Cost center" value={asset.cost_center ?? "-"} />
        <HeroStat label="Garanzia" value={asset.warranty_expiry_date ?? "-"} />
      </div>

      <Panel eyebrow="Attivita" title="Cosa puoi fare su questo asset">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <ActionShortcut to="#assignment-workflow" title="Assegna asset" description="Consegna il bene a un utente o reparto." icon={PeopleIcon} />
          <ActionShortcut to="#assignment-workflow" title="Registra rientro" description="Chiudi l'assegnazione attiva e rendilo disponibile." icon={PlusIcon} />
          <ActionShortcut to="#maintenance-workflow" title="Apri ticket" description="Avvia una lavorazione di manutenzione." icon={MaintenanceIcon} />
          <ActionShortcut to="#operational-workflow" title="Cambia stato" description="Aggiorna stato e collocazione operativa." icon={SettingsIcon} />
          <ActionShortcut to={`/assets/${asset.id}/edit`} title="Aggiorna anagrafica" description="Modifica dati, lifecycle e dismissione." icon={AssetIcon} />
        </div>
      </Panel>

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-6">
          <Panel title="Panoramica" eyebrow="Inventario">
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
            {asset.description ? <p className="mt-4 text-sm leading-6 text-muted-foreground">{asset.description}</p> : null}
          </Panel>

          <Panel title="Foto asset" eyebrow="Anteprima">
            {asset.photo_document && photoPreviewUrl ? (
              <div className="flex flex-col gap-4">
                <img
                  src={photoPreviewUrl}
                  alt={`Foto ${asset.name}`}
                  width={1280}
                  height={720}
                  className="max-h-80 w-full rounded-md border border-border object-cover"
                />
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{asset.photo_document.file_name}</span>
                  <Button type="button" variant="link" onClick={() => downloadDocumentMutation.mutate(asset.photo_document!.id)} className="px-0">
                    Scarica foto
                  </Button>
                </div>
              </div>
            ) : (
              <Empty>
                <EmptyHeader>
                  <EmptyTitle>Nessuna foto dedicata disponibile</EmptyTitle>
                  <EmptyDescription>Carica un documento immagine per vedere l'anteprima dell'asset.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </Panel>

          <Panel title="Storico eventi" eyebrow="Audit">
            <div className="flex flex-col gap-3">
              {asset.events.length === 0 ? (
                <Empty>
                  <EmptyHeader>
                    <EmptyTitle>Nessun evento registrato.</EmptyTitle>
                    <EmptyDescription>Le modifiche operative appariranno qui in ordine cronologico.</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : null}
              {asset.events.map((event) => (
                <EventTimelineItem key={event.id} event={event} />
              ))}
            </div>
          </Panel>

          <Panel title="Documenti" eyebrow="Repository">
            <div className="flex flex-col gap-4">
              <label className="block rounded-md border border-dashed border-border bg-muted p-4 text-sm text-muted-foreground">
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

              {asset.documents.length === 0 ? (
                <Empty>
                  <EmptyHeader>
                    <EmptyTitle>Nessun documento caricato</EmptyTitle>
                    <EmptyDescription>I documenti associati all'asset saranno disponibili in questa sezione.</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <div className="flex flex-col gap-2">
                  {asset.documents.map((document) => (
                    <div key={document.id} className="flex items-center justify-between rounded-md border border-border bg-background p-3 text-sm">
                      <div className="flex flex-col gap-1">
                        <p className="font-medium text-foreground">{document.file_name}</p>
                        <p className="text-muted-foreground">
                          {document.content_type} · {Math.round(document.size_bytes / 1024)} KB
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-muted-foreground">{new Date(document.created_at).toLocaleDateString()}</span>
                        <Button type="button" variant="link" onClick={() => downloadDocumentMutation.mutate(document.id)} className="px-0">
                          Scarica
                        </Button>
                        <Button
                          type="button"
                          variant="link"
                          onClick={() => setPendingDeleteDocument({ id: document.id, fileName: document.file_name })}
                          className="px-0 text-destructive"
                        >
                          Elimina
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {uploadMutation.error || deleteDocumentMutation.error || downloadDocumentMutation.error ? (
                <Alert variant="destructive">
                  <AlertTitle>Operazione documentale non completata</AlertTitle>
                  <AlertDescription>
                    {String(uploadMutation.error?.message || deleteDocumentMutation.error?.message || downloadDocumentMutation.error?.message)}
                  </AlertDescription>
                </Alert>
              ) : null}
            </div>
          </Panel>

          <Panel title="Ticket di manutenzione" eyebrow="Supporto" id="maintenance-workflow">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-2">
                <label htmlFor="maintenance-ticket-title" className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Titolo ticket
                </label>
                <Input id="maintenance-ticket-title" name="maintenance-ticket-title" value={ticketTitle} onChange={(event) => setTicketTitle(event.target.value)} placeholder="Titolo ticket..." />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="maintenance-ticket-description" className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Descrizione
                </label>
                <Textarea id="maintenance-ticket-description" name="maintenance-ticket-description" value={ticketDescription} onChange={(event) => setTicketDescription(event.target.value)} placeholder="Descrivi il problema..." />
              </div>
              <div className="flex justify-end">
                <Button type="button" disabled={!ticketTitle || maintenanceMutation.isPending} onClick={() => maintenanceMutation.mutate()}>
                  {maintenanceMutation.isPending ? "Apertura..." : "Apri ticket di manutenzione"}
                </Button>
              </div>

              {(maintenanceTickets?.items ?? []).length === 0 ? (
                <Empty>
                  <EmptyHeader>
                    <EmptyTitle>Nessun ticket di manutenzione collegato</EmptyTitle>
                    <EmptyDescription>Apri il primo ticket per tracciare interventi e anomalie su questo asset.</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <div className="flex flex-col gap-2">
                  {(maintenanceTickets?.items ?? []).map((ticket) => (
                    <Link key={ticket.id} to={`/maintenance-tickets/${ticket.id}`} className="flex items-center justify-between rounded-md border border-border bg-background p-3 text-sm transition hover:bg-accent">
                      <div className="flex flex-col gap-1">
                        <p className="font-medium text-foreground">{ticket.title}</p>
                        <p className="text-muted-foreground">{ticket.status}</p>
                      </div>
                      <span className="text-muted-foreground">{new Date(ticket.opened_at).toLocaleDateString()}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </Panel>
        </div>

        <div className="flex flex-col gap-6">
          <Panel title="Assegna asset" eyebrow="Workflow" id="assignment-workflow">
            <div className="flex flex-col gap-3">
              <Alert>
                <AlertTitle>Contesto operativo</AlertTitle>
                <AlertDescription>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge tone={isAssignmentBlockedByStatus ? "danger" : "neutral"}>Stato: {asset.status.code ?? asset.status.name}</Badge>
                    <Badge tone={asset.assigned_employee ? "warning" : "success"}>
                      {asset.assigned_employee ? `Assegnato a ${asset.assigned_employee.full_name}` : "Disponibile"}
                    </Badge>
                  </div>
                </AlertDescription>
              </Alert>
              <div className="flex flex-col gap-2">
                <label htmlFor="assign-employee" className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Assegnatario
                </label>
                <SelectField value={selectedEmployeeId} onValueChange={setSelectedEmployeeId} placeholder="Seleziona assegnatario" options={employees.map((employee) => ({ value: String(employee.id), label: employee.full_name }))} />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="assign-department" className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Dipartimento
                </label>
                <SelectField value={selectedDepartmentId} onValueChange={setSelectedDepartmentId} placeholder="Nessun dipartimento" options={departments.map((item) => ({ value: String(item.id), label: item.name }))} />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="assign-location" className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Sede assegnazione
                </label>
                <SelectField value={selectedAssignmentLocationId} onValueChange={setSelectedAssignmentLocationId} placeholder="Mantieni sede attuale" options={locations.map((item) => ({ value: String(item.id), label: item.name }))} />
              </div>
              <Button type="button" disabled={!canAssign} onClick={() => assignMutation.mutate()} className="w-full">
                {assignMutation.isPending ? "Assegnazione..." : "Assegna asset"}
              </Button>
              {!canAssign ? (
                <p className="text-xs text-muted-foreground" aria-live="polite">
                  {isAssignmentBlockedByStatus
                    ? "Asset non assegnabile: stato RETIRED o DISPOSED."
                    : isAlreadyAssigned
                      ? "Asset gia assegnato: registra prima il rientro."
                      : "Seleziona un assegnatario per procedere."}
                </p>
              ) : null}
              {asset.assigned_employee ? (
                <Button type="button" variant="secondary" onClick={() => returnMutation.mutate()} disabled={returnMutation.isPending} className="w-full">
                  {returnMutation.isPending ? "Rientro..." : "Registra rientro"}
                </Button>
              ) : null}
            </div>
          </Panel>

          <Panel title="Modifiche operative" eyebrow="Aggiornamenti" id="operational-workflow">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-2">
                <label htmlFor="operational-status" className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Stato
                </label>
                <SelectField value={selectedStatusId} onValueChange={setSelectedStatusId} placeholder="Cambia stato" options={statuses.map((item) => ({ value: String(item.id), label: item.name }))} />
              </div>
              <Button type="button" variant="secondary" disabled={!canApplyStatus} onClick={() => statusMutation.mutate()} className="w-full">
                Applica stato
              </Button>
              {isStatusUnchanged ? <p className="text-xs text-muted-foreground">Lo stato selezionato e gia quello corrente.</p> : null}

              <div className="flex flex-col gap-2">
                <label htmlFor="operational-location" className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Sede
                </label>
                <SelectField value={selectedRelocationLocationId} onValueChange={setSelectedRelocationLocationId} placeholder="Nessuna sede" options={locations.map((item) => ({ value: String(item.id), label: item.name }))} />
              </div>
              <Button type="button" variant="secondary" disabled={!canApplyLocation} onClick={() => locationMutation.mutate()} className="w-full">
                Applica sede
              </Button>
              {isLocationUnchanged ? <p className="text-xs text-muted-foreground">La sede selezionata coincide con quella attuale.</p> : null}
            </div>
          </Panel>
        </div>
      </div>

      <AlertDialog
        open={pendingDeleteDocument !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPendingDeleteDocument(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare il documento?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDeleteDocument
                ? `Il file "${pendingDeleteDocument.fileName}" verra rimosso dal repository documentale dell'asset.`
                : "Questa operazione rimuove in modo definitivo il documento selezionato."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingDeleteDocument) {
                  deleteDocumentMutation.mutate(pendingDeleteDocument.id);
                }
              }}
            >
              Elimina documento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ActionShortcut({
  to,
  title,
  description,
  icon: Icon,
}: {
  to: string;
  title: string;
  description: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}) {
  const isAnchor = to.startsWith("#");
  const className = "rounded-md border border-border bg-muted px-4 py-4 transition hover:bg-accent";

  if (isAnchor) {
    return (
      <a href={to} className={className}>
        <p className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
          <Icon className="h-4 w-4 text-muted-foreground" />
          {title}
        </p>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">{description}</p>
      </a>
    );
  }

  return (
    <Link to={to} className={className}>
      <p className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
        <Icon className="h-4 w-4 text-muted-foreground" />
        {title}
      </p>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">{description}</p>
    </Link>
  );
}

function InfoGrid({ items }: { items: Array<[string, string]> }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {items.map(([label, value]) => (
        <div key={label}>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="mt-1 text-sm text-foreground">{value}</p>
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
    <div className="relative rounded-md border border-border bg-background p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className={["mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold", meta.tone].join(" ")}>
            {meta.label}
          </span>
          <div>
            <p className="font-medium text-foreground">{meta.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {performedBy} · {createdAt}
            </p>
          </div>
        </div>
        <span className="text-xs uppercase tracking-wide text-muted-foreground">{event.event_type}</span>
      </div>
      {meta.rows.length > 0 ? (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {meta.rows.map((row) => (
            <div key={`${event.id}-${row.label}`} className="rounded-xl bg-muted px-3 py-2">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{row.label}</p>
              <p className="mt-1 text-sm text-foreground">{row.value}</p>
            </div>
          ))}
        </div>
      ) : null}
      {meta.note ? <p className="mt-4 rounded-xl bg-muted px-3 py-2 text-sm text-foreground">{meta.note}</p> : null}
    </div>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-card p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm font-semibold text-foreground">{value}</p>
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
        ...(note ? { note } : {}),
      };
    case "RETURN":
      return {
        label: "Rientro",
        title: "Asset rientrato in disponibilita",
        tone: "bg-indigo-100 text-indigo-800",
        rows: [],
        ...(note ? { note } : {}),
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
        ...(note ? { note } : {}),
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
        ...(note ? { note } : {}),
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
        tone: "bg-secondary text-secondary-foreground",
        rows: buildRows([["Data dismissione", getString(details.disposal_date)]]),
      };
    default:
      return {
        label: "Evento",
        title: event.summary,
        tone: "bg-secondary text-secondary-foreground",
        rows: buildRows(Object.entries(details).map(([key, value]) => [humanizeKey(key), formatUnknown(value)])),
      };
  }
}

function buildRows(entries: Array<[string, string | undefined]>): Array<{ label: string; value: string }> {
  return entries.filter(([, value]) => value && value !== "null").map(([label, value]) => ({ label, value: value ?? "-" }));
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


