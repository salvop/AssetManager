import { Link } from "react-router-dom";
import type { ComponentType, SVGProps } from "react";

import { Badge } from "../components/ui/badge";
import {
  AssetIcon,
  LicenseIcon,
  MaintenanceIcon,
  PeopleIcon,
  PlusIcon,
} from "../components/ui/icons";
import { PageHeader } from "../components/ui/page-header";
import { useDashboardSummary } from "../hooks/useDashboardSummary";

export function DashboardPage() {
  const { data, isLoading, error } = useDashboardSummary();
  const softwareAlertsCount = (data?.notifications ?? []).filter((item) => item.category === "SOFTWARE_LICENSE").length;

  const workflowActivities = [
    {
      title: "Registra asset",
      description: "Crea un nuovo bene e avvia il workflow operativo.",
      to: "/assets/new",
      count: null,
      icon: PlusIcon,
    },
    {
      title: "Assegna asset",
      description: "Beni disponibili pronti per la consegna.",
      to: "/assets",
      count: data?.assets_ready_for_assignment.length ?? 0,
      icon: AssetIcon,
    },
    {
      title: "Registra rientro",
      description: "Assegnazioni con rientro da verificare.",
      to: "/assets",
      count: data ? data.assignments_due_soon + data.overdue_assignments : 0,
      icon: PeopleIcon,
    },
    {
      title: "Gestisci licenze",
      description: "Monitora disponibilita e scadenze software.",
      to: "/software-licenses",
      count: softwareAlertsCount,
      icon: LicenseIcon,
    },
    {
      title: "Apri ticket",
      description: "Gestisci guasti, verifiche e interventi.",
      to: "/maintenance-tickets",
      count: data?.open_maintenance_tickets ?? 0,
      icon: MaintenanceIcon,
    },
  ];

  const cards = [
    { title: "Asset totali", value: data?.total_assets ?? "--" },
    { title: "Asset assegnati", value: data?.assigned_assets ?? "--" },
    { title: "Ticket aperti", value: data?.open_maintenance_tickets ?? "--" },
    { title: "Attenzioni aperte", value: data?.total_notifications ?? "--" },
  ];

  const attentionItems: Array<{
    key: string;
    title: string;
    body: string;
    meta: string;
    to: string;
    tone: "amber" | "rose";
  }> = [
    ...(data?.lifecycle_alerts ?? []).slice(0, 3).map((alert) => ({
      key: `lifecycle-${alert.asset_id}-${alert.alert_type}`,
      title: alert.asset_name,
      body: `${alert.asset_tag} · ${alert.alert_type === "WARRANTY" ? "Garanzia" : "Fine vita"} ${alert.due_date}`,
      meta: `${alert.days_remaining} gg`,
      to: `/assets/${alert.asset_id}`,
      tone: "amber" as const,
    })),
    ...(data?.assignment_alerts ?? []).slice(0, 3).map((alert) => ({
      key: `assignment-${alert.asset_id}-${alert.expected_return_at}`,
      title: alert.asset_name,
      body: `${alert.asset_tag} · ${alert.assigned_employee_name}`,
      meta: alert.days_remaining < 0 ? `${Math.abs(alert.days_remaining)} gg oltre` : `${alert.days_remaining} gg`,
      to: `/assets/${alert.asset_id}/assignments`,
      tone: alert.days_remaining < 0 ? ("rose" as const) : ("amber" as const),
    })),
  ].slice(0, 6);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Dashboard"
        title="Panoramica operativa"
        description="Una vista unica per capire cosa fare adesso, cosa richiede attenzione e cosa e cambiato di recente."
        actions={(
          <div className="flex flex-wrap gap-2">
          <QuickLink to="/assets/new" title="Nuovo asset" icon={PlusIcon} />
          <QuickLink to="/assets" title="Inventario" icon={AssetIcon} />
          <QuickLink to="/software-licenses" title="Licenze software" icon={LicenseIcon} />
          <QuickLink to="/maintenance-tickets" title="Manutenzione" icon={MaintenanceIcon} />
          </div>
        )}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <section key={card.title} className="app-panel">
            <p className="text-sm font-medium text-slate-500">{card.title}</p>
            <p className="mt-4 text-3xl font-semibold tracking-tight tabular-nums text-slate-950">{isLoading ? "…" : card.value}</p>
          </section>
        ))}
      </div>

      <section className="app-panel">
        <SectionHeading eyebrow="Workflow" title="Attivita principali" />
        <div className="mt-5 grid gap-4 xl:grid-cols-5">
          {workflowActivities.map((activity) => (
            <Link
              key={activity.title}
              to={activity.to}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 transition hover:bg-white"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <activity.icon className="h-4 w-4 text-slate-500" />
                    {activity.title}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-slate-500">{activity.description}</p>
                </div>
                {activity.count !== null && (
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                    {isLoading ? "…" : activity.count}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
        <section className="app-panel">
          <SectionHeading eyebrow="Attenzioni" title="Da presidiare" actionLabel="Apri inventario" actionTo="/assets" />
          <div className="mt-5 space-y-3">
            {attentionItems.map((item) => (
              <Link
                key={item.key}
                to={item.to}
                className="block rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 transition hover:bg-white"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{item.body}</p>
                  </div>
                  <Badge className={badgeTone(item.tone)}>{item.meta}</Badge>
                </div>
              </Link>
            ))}
            {!isLoading && attentionItems.length === 0 && (
              <p className="text-sm text-slate-500">Nessuna attenzione operativa aperta.</p>
            )}
          </div>
        </section>

        <section className="app-panel">
          <SectionHeading eyebrow="Code operative" title="Da prendere in carico" />
          <div className="mt-5 space-y-4">
            <QueueBlock
              title="Pronti da assegnare"
              emptyText="Nessun asset pronto da assegnare."
              items={(data?.assets_ready_for_assignment ?? []).slice(0, 4).map((asset) => ({
                key: `ready-${asset.asset_id}`,
                label: asset.asset_name,
                sublabel: `${asset.asset_tag}${asset.location_name ? ` · ${asset.location_name}` : ""}`,
                to: `/assets/${asset.asset_id}`,
              }))}
            />
            <QueueBlock
              title="Ritirati da chiudere"
              emptyText="Nessun asset ritirato da chiudere."
              items={(data?.retired_assets_pending_disposal ?? []).slice(0, 4).map((asset) => ({
                key: `retired-${asset.asset_id}`,
                label: asset.asset_name,
                sublabel: asset.asset_tag,
                to: `/assets/${asset.asset_id}/edit`,
              }))}
            />
            <QueueBlock
              title="Ticket da presidiare"
              emptyText="Nessun ticket aperto da presidiare."
              items={(data?.maintenance_queue ?? []).slice(0, 4).map((ticket) => ({
                key: `ticket-${ticket.ticket_id}`,
                label: ticket.title,
                sublabel: `${ticket.asset_tag} · aperto da ${ticket.opened_days} giorni`,
                to: `/maintenance-tickets/${ticket.ticket_id}`,
              }))}
            />
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="app-panel">
          <SectionHeading eyebrow="Recenti" title="Asset recenti" actionLabel="Vedi tutti" actionTo="/assets" />
          <div className="mt-5 space-y-3">
            {(data?.recent_assets ?? []).map((asset) => (
              <Link
                key={asset.id}
                to={`/assets/${asset.id}`}
                className="block rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 transition hover:bg-white"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{asset.name}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {asset.asset_tag} · {asset.status_name}
                    </p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200">
                    {asset.status_code}
                  </span>
                </div>
              </Link>
            ))}
            {!isLoading && (data?.recent_assets ?? []).length === 0 && (
              <p className="text-sm text-slate-500">Nessun asset disponibile.</p>
            )}
          </div>
        </section>

        <section className="app-panel">
          <SectionHeading eyebrow="Recenti" title="Ticket aperti" actionLabel="Apri manutenzione" actionTo="/maintenance-tickets" />
          <div className="mt-5 space-y-3">
            {(data?.recent_open_tickets ?? []).map((ticket) => (
              <Link
                key={ticket.id}
                to={`/maintenance-tickets/${ticket.id}`}
                className="block rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 transition hover:bg-white"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{ticket.title}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {ticket.asset_tag} · {ticket.asset_name}
                    </p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200">
                    {ticket.status}
                  </span>
                </div>
              </Link>
            ))}
            {!isLoading && (data?.recent_open_tickets ?? []).length === 0 && (
              <p className="text-sm text-slate-500">Nessun ticket aperto.</p>
            )}
          </div>
        </section>
      </div>

      {error && <p className="text-sm text-rose-600">{error.message}</p>}
    </div>
  );
}

function QueueBlock({
  title,
  items,
  emptyText,
}: {
  title: string;
  items: Array<{ key: string; label: string; sublabel: string; to: string }>;
  emptyText: string;
}) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
      <div className="mt-3 space-y-2">
        {items.map((item) => (
          <Link
            key={item.key}
            to={item.to}
            className="block rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 transition hover:bg-white"
          >
            <p className="text-sm font-medium text-slate-900">{item.label}</p>
            <p className="mt-1 text-xs text-slate-500">{item.sublabel}</p>
          </Link>
        ))}
        {!items.length && <p className="text-sm text-slate-500">{emptyText}</p>}
      </div>
    </div>
  );
}

function QuickLink({
  to,
  title,
  icon: Icon,
}: {
  to: string;
  title: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
    >
      <Icon className="h-4 w-4 text-slate-500" />
      {title}
    </Link>
  );
}

function SectionHeading({
  eyebrow,
  title,
  actionLabel,
  actionTo,
}: {
  eyebrow: string;
  title: string;
  actionLabel?: string;
  actionTo?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">{eyebrow}</p>
        <h3 className="mt-2 text-lg font-semibold text-slate-900">{title}</h3>
      </div>
      {actionLabel && actionTo ? (
        <Link to={actionTo} className="text-sm font-medium text-brand-700 transition hover:text-brand-900">
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}

function badgeTone(tone: "amber" | "rose") {
  if (tone === "rose") {
    return "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200";
  }
  return "bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-200";
}
