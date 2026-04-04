import { Link } from "react-router-dom";

import { useDashboardSummary } from "../hooks/useDashboardSummary";

export function DashboardPage() {
  const { data, isLoading, error } = useDashboardSummary();
  const workflowActivities = [
    {
      title: "Registra asset",
      description: "Inserisci un nuovo bene e avvia la sua storia operativa.",
      actionLabel: "Apri registrazione",
      to: "/assets/new",
      count: null,
    },
    {
      title: "Assegna asset",
      description: "Beni disponibili e pronti per essere consegnati.",
      actionLabel: "Vai ai pronti da assegnare",
      to: "/assets",
      count: data?.assets_ready_for_assignment.length ?? 0,
    },
    {
      title: "Registra rientro",
      description: "Assegnazioni con rientro da confermare o gia scadute.",
      actionLabel: "Controlla i rientri",
      to: "/assets",
      count: data ? data.assignments_due_soon + data.overdue_assignments : 0,
    },
    {
      title: "Apri ticket",
      description: "Avvia una gestione di manutenzione o supporto tecnico.",
      actionLabel: "Vai alla manutenzione",
      to: "/maintenance-tickets",
      count: data?.open_maintenance_tickets ?? 0,
    },
    {
      title: "Completa fine vita",
      description: "Chiudi gli asset ritirati registrando la dismissione.",
      actionLabel: "Apri gli asset ritirati",
      to: "/assets",
      count: data?.retired_assets_pending_disposal.length ?? 0,
    },
  ];
  const cards = [
    { title: "Asset totali", value: data?.total_assets ?? "--", tone: "bg-brand-100/70 text-brand-900 ring-brand-200" },
    { title: "Asset assegnati", value: data?.assigned_assets ?? "--", tone: "bg-sky-100 text-sky-900 ring-sky-200" },
    { title: "In manutenzione", value: data?.assets_in_maintenance ?? "--", tone: "bg-amber-100 text-amber-900 ring-amber-200" },
    { title: "Ticket aperti", value: data?.open_maintenance_tickets ?? "--", tone: "bg-rose-100 text-rose-900 ring-rose-200" },
    { title: "Garanzie in scadenza", value: data?.warranties_expiring_soon ?? "--", tone: "bg-orange-100 text-orange-900 ring-orange-200" },
    { title: "Fine vita entro 60 giorni", value: data?.end_of_life_soon ?? "--", tone: "bg-violet-100 text-violet-900 ring-violet-200" },
    { title: "Rientri entro 14 giorni", value: data?.assignments_due_soon ?? "--", tone: "bg-emerald-100 text-emerald-900 ring-emerald-200" },
    { title: "Rientri scaduti", value: data?.overdue_assignments ?? "--", tone: "bg-rose-100 text-rose-900 ring-rose-200" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-700">Dashboard</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Panoramica operativa</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">Stato dell’inventario, attività aperte e punti di attenzione correnti.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <QuickLink to="/assets/new" title="Nuovo asset" />
          <QuickLink to="/assets" title="Inventario" />
          <QuickLink to="/maintenance-tickets" title="Manutenzione" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <section key={card.title} className="app-panel">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-500">{card.title}</p>
                <p className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">{isLoading ? "..." : card.value}</p>
              </div>
              <span className={["inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1", card.tone].join(" ")}>
                KPI
              </span>
            </div>
          </section>
        ))}
      </div>

      <section className="app-panel">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Attivita</p>
            <h3 className="mt-2 text-lg font-semibold text-slate-900">Workflow principali</h3>
            <p className="mt-2 text-sm text-slate-500">Le operazioni centrali del sistema, organizzate come attivita da eseguire.</p>
          </div>
        </div>
        <div className="mt-5 grid gap-4 xl:grid-cols-5">
          {workflowActivities.map((activity) => (
            <Link
              key={activity.title}
              to={activity.to}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 transition hover:bg-white"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{activity.title}</p>
                  <p className="mt-2 text-xs leading-5 text-slate-500">{activity.description}</p>
                </div>
                {activity.count !== null && (
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                    {isLoading ? "..." : activity.count}
                  </span>
                )}
              </div>
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">{activity.actionLabel}</p>
            </Link>
          ))}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <section className="app-panel">
          <SectionHeading eyebrow="Inventario" title="Distribuzione stati" actionLabel="Apri inventario" actionTo="/assets" />
          <div className="mt-5 space-y-4">
            {(data?.assets_by_status ?? []).map((item) => {
              const totalAssets = data?.total_assets || 1;
              const width = Math.max((item.total / totalAssets) * 100, 4);
              return (
                <div key={item.status_id}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-slate-600">{item.status_name}</span>
                    <span className="font-medium text-slate-900">{item.total}</span>
                  </div>
                  <div className="h-3 rounded-full bg-slate-100/80">
                    <div
                      className="h-3 rounded-full bg-gradient-to-r from-brand-600 to-brand-500 shadow-[0_0_24px_rgba(16,185,129,0.25)]"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {!isLoading && (data?.assets_by_status ?? []).length === 0 && (
              <p className="text-sm text-slate-500">Nessun asset disponibile.</p>
            )}
          </div>
        </section>

        <section className="app-panel">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Operativita</p>
            <h3 className="mt-2 text-lg font-semibold text-slate-900">Azioni rapide</h3>
          </div>
          <div className="mt-5 grid gap-3">
            <QuickAction to="/assets/new" label="Registra un nuovo asset" />
            <QuickAction to="/assets" label="Controlla inventario e assegnazioni" />
            <QuickAction to="/maintenance-tickets" label="Apri o gestisci ticket di manutenzione" />
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="app-panel">
          <SectionHeading eyebrow="Coda di lavoro" title="Pronti da assegnare" actionLabel="Apri inventario" actionTo="/assets" />
          <div className="mt-5 space-y-3">
            {(data?.assets_ready_for_assignment ?? []).map((asset) => (
              <Link
                key={`assign-${asset.asset_id}`}
                to={`/assets/${asset.asset_id}`}
                className="block rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 transition hover:bg-white"
              >
                <p className="text-sm font-semibold text-slate-900">{asset.asset_name}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {asset.asset_tag}
                  {asset.location_name ? ` · ${asset.location_name}` : ""}
                </p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">Prossima azione: assegnare</p>
              </Link>
            ))}
            {!isLoading && (data?.assets_ready_for_assignment ?? []).length === 0 && (
              <p className="text-sm text-slate-500">Nessun asset attualmente pronto da assegnare.</p>
            )}
          </div>
        </section>

        <section className="app-panel">
          <SectionHeading eyebrow="Coda di lavoro" title="Ritirati da chiudere" actionLabel="Apri inventario" actionTo="/assets" />
          <div className="mt-5 space-y-3">
            {(data?.retired_assets_pending_disposal ?? []).map((asset) => (
              <Link
                key={`retired-${asset.asset_id}`}
                to={`/assets/${asset.asset_id}/edit`}
                className="block rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 transition hover:bg-white"
              >
                <p className="text-sm font-semibold text-slate-900">{asset.asset_name}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {asset.asset_tag}
                  {asset.location_name ? ` · ${asset.location_name}` : ""}
                </p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">
                  Prossima azione: registrare dismissione
                </p>
              </Link>
            ))}
            {!isLoading && (data?.retired_assets_pending_disposal ?? []).length === 0 && (
              <p className="text-sm text-slate-500">Nessun asset ritirato in attesa di chiusura.</p>
            )}
          </div>
        </section>

        <section className="app-panel">
          <SectionHeading eyebrow="Coda di lavoro" title="Ticket da presidiare" actionLabel="Vai ai ticket" actionTo="/maintenance-tickets" />
          <div className="mt-5 space-y-3">
            {(data?.maintenance_queue ?? []).map((ticket) => (
              <Link
                key={`queue-${ticket.ticket_id}`}
                to={`/maintenance-tickets/${ticket.ticket_id}`}
                className="block rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 transition hover:bg-white"
              >
                <p className="text-sm font-semibold text-slate-900">{ticket.title}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {ticket.asset_tag} · {ticket.asset_name}
                </p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-rose-700">
                  Aperto da {ticket.opened_days} giorni
                </p>
              </Link>
            ))}
            {!isLoading && (data?.maintenance_queue ?? []).length === 0 && (
              <p className="text-sm text-slate-500">Nessun ticket aperto da presidiare.</p>
            )}
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="app-panel">
          <SectionHeading eyebrow="Flusso asset" title="Asset recenti" actionLabel="Vedi tutti" actionTo="/assets" />
          <div className="mt-5 space-y-3">
            {(data?.recent_assets ?? []).map((asset) => (
              <Link
                key={asset.id}
                to={`/assets/${asset.id}`}
                className="block rounded-2xl border border-slate-200/70 bg-white/85 px-4 py-3 transition hover:-translate-y-0.5 hover:border-brand-200 hover:bg-white"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{asset.name}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {asset.asset_tag} · {asset.status_name}
                    </p>
                    {(asset.warranty_expiry_date || asset.expected_end_of_life_date) && (
                      <p className="mt-1 text-xs text-slate-500">
                        {[
                          asset.warranty_expiry_date ? `Garanzia: ${asset.warranty_expiry_date}` : null,
                          asset.expected_end_of_life_date ? `Fine vita: ${asset.expected_end_of_life_date}` : null,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    )}
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
          <SectionHeading eyebrow="Supporto" title="Ticket aperti recenti" actionLabel="Apri manutenzione" actionTo="/maintenance-tickets" />
          <div className="mt-5 space-y-3">
            {(data?.recent_open_tickets ?? []).map((ticket) => (
              <Link
                key={ticket.id}
                to={`/maintenance-tickets/${ticket.id}`}
                className="block rounded-2xl border border-slate-200/70 bg-white/85 px-4 py-3 transition hover:-translate-y-0.5 hover:border-brand-200 hover:bg-white"
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

      <section className="app-panel">
        <SectionHeading eyebrow="Lifecycle" title="Scadenze lifecycle" actionLabel="Controlla inventario" actionTo="/assets" />
        <div className="mt-5 space-y-3">
          {(data?.lifecycle_alerts ?? []).map((alert) => (
            <Link
              key={`${alert.alert_type}-${alert.asset_id}`}
              to={`/assets/${alert.asset_id}`}
              className="block rounded-2xl border border-slate-200/70 bg-white/85 px-4 py-3 transition hover:-translate-y-0.5 hover:border-brand-200 hover:bg-white"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{alert.asset_name}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {alert.asset_tag} · {alert.alert_type === "WARRANTY" ? "Garanzia" : "Fine vita"} · {alert.due_date}
                  </p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200">
                  {alert.days_remaining} gg
                </span>
              </div>
            </Link>
          ))}
          {!isLoading && (data?.lifecycle_alerts ?? []).length === 0 && (
            <p className="text-sm text-slate-500">Nessuna scadenza lifecycle nei prossimi 60 giorni.</p>
          )}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="app-panel">
          <SectionHeading eyebrow="Assegnazioni" title="Rientri da monitorare" actionLabel="Vai agli asset" actionTo="/assets" />
          <div className="mt-5 space-y-3">
            {(data?.assignment_alerts ?? []).map((alert) => (
              <Link
                key={`${alert.asset_id}-${alert.expected_return_at}`}
                to={`/assets/${alert.asset_id}/assignments`}
                className="block rounded-2xl border border-slate-200/70 bg-white/85 px-4 py-3 transition hover:-translate-y-0.5 hover:border-brand-200 hover:bg-white"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{alert.asset_name}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {alert.asset_tag} · {alert.assigned_user_name} · rientro previsto{" "}
                      {new Date(alert.expected_return_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={[
                      "rounded-full px-3 py-1 text-xs font-medium ring-1",
                      alert.days_remaining < 0
                        ? "bg-rose-50 text-rose-700 ring-rose-200"
                        : "bg-amber-50 text-amber-800 ring-amber-200",
                    ].join(" ")}
                  >
                    {alert.days_remaining < 0 ? `${Math.abs(alert.days_remaining)} gg oltre` : `${alert.days_remaining} gg`}
                  </span>
                </div>
              </Link>
            ))}
            {!isLoading && (data?.assignment_alerts ?? []).length === 0 && (
              <p className="text-sm text-slate-500">Nessun rientro imminente o scaduto.</p>
            )}
          </div>
        </section>

        <section className="app-panel">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Inbox</p>
              <h3 className="mt-2 text-lg font-semibold text-slate-900">Notifiche interne</h3>
            </div>
            <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white">
              {data?.total_notifications ?? 0} attive
            </span>
          </div>
          <div className="mt-5 space-y-3">
            {(data?.notifications ?? []).map((notification) => (
              <Link
                key={`${notification.category}-${notification.title}-${notification.link}`}
                to={notification.link}
                className="block rounded-2xl border border-slate-200/70 bg-white/85 px-4 py-3 transition hover:-translate-y-0.5 hover:border-brand-200 hover:bg-white"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{notification.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{notification.body}</p>
                  </div>
                  <span
                    className={[
                      "rounded-full px-3 py-1 text-xs font-medium ring-1",
                      notification.severity === "high"
                        ? "bg-rose-50 text-rose-700 ring-rose-200"
                        : "bg-amber-50 text-amber-800 ring-amber-200",
                    ].join(" ")}
                  >
                    {notification.category}
                  </span>
                </div>
              </Link>
            ))}
            {!isLoading && (data?.notifications ?? []).length === 0 && (
              <p className="text-sm text-slate-500">Nessuna notifica interna aperta.</p>
            )}
          </div>
        </section>
      </div>

      {error && <p className="text-sm text-rose-600">{error.message}</p>}
    </div>
  );
}

function QuickLink({ to, title }: { to: string; title: string }) {
  return (
    <Link
      to={to}
      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
    >
      {title}
    </Link>
  );
}

function QuickAction({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="rounded-2xl border border-white/80 bg-white/80 px-4 py-3 text-sm font-medium shadow-sm transition hover:-translate-y-0.5 hover:bg-white"
    >
      {label}
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
  actionLabel: string;
  actionTo: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">{eyebrow}</p>
        <h3 className="mt-2 text-lg font-semibold text-slate-900">{title}</h3>
      </div>
      <Link to={actionTo} className="text-sm font-medium text-brand-700 transition hover:text-brand-900">
        {actionLabel}
      </Link>
    </div>
  );
}
