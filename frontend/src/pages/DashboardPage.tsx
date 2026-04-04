import { Link } from "react-router-dom";

import { useDashboardSummary } from "../hooks/useDashboardSummary";

export function DashboardPage() {
  const { data, isLoading, error } = useDashboardSummary();
  const cards = [
    { title: "Asset totali", value: data?.total_assets ?? "--" },
    { title: "Asset assegnati", value: data?.assigned_assets ?? "--" },
    { title: "In manutenzione", value: data?.assets_in_maintenance ?? "--" },
    { title: "Ticket aperti", value: data?.open_maintenance_tickets ?? "--" },
  ];

  return (
    <div>
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-700">Panoramica</p>
        <h2 className="mt-2 text-3xl font-semibold">Dashboard operativa</h2>
        <p className="mt-2 text-sm text-slate-500">Controlla rapidamente inventario, lavoro aperto e ultimi movimenti rilevanti.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <section key={card.title} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">{card.title}</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">{isLoading ? "..." : card.value}</p>
          </section>
        ))}
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Distribuzione stati</h3>
            <Link to="/assets" className="text-sm font-medium text-brand-700">
              Apri inventario
            </Link>
          </div>
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
                  <div className="h-3 rounded-full bg-slate-100">
                    <div className="h-3 rounded-full bg-brand-600" style={{ width: `${width}%` }} />
                  </div>
                </div>
              );
            })}
            {!isLoading && (data?.assets_by_status ?? []).length === 0 && (
              <p className="text-sm text-slate-500">Nessun asset disponibile.</p>
            )}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Azioni rapide</h3>
          <div className="mt-5 grid gap-3">
            <Link to="/assets/new" className="rounded-lg border border-slate-200 px-4 py-3 text-sm font-medium hover:bg-slate-50">
              Registra un nuovo asset
            </Link>
            <Link to="/assets" className="rounded-lg border border-slate-200 px-4 py-3 text-sm font-medium hover:bg-slate-50">
              Controlla inventario e assegnazioni
            </Link>
            <Link to="/maintenance-tickets" className="rounded-lg border border-slate-200 px-4 py-3 text-sm font-medium hover:bg-slate-50">
              Apri o gestisci ticket di manutenzione
            </Link>
          </div>
        </section>
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Asset recenti</h3>
            <Link to="/assets" className="text-sm font-medium text-brand-700">
              Vedi tutti
            </Link>
          </div>
          <div className="mt-5 space-y-3">
            {(data?.recent_assets ?? []).map((asset) => (
              <Link
                key={asset.id}
                to={`/assets/${asset.id}`}
                className="block rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 hover:bg-slate-100"
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

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Ticket aperti recenti</h3>
            <Link to="/maintenance-tickets" className="text-sm font-medium text-brand-700">
              Apri manutenzione
            </Link>
          </div>
          <div className="mt-5 space-y-3">
            {(data?.recent_open_tickets ?? []).map((ticket) => (
              <Link
                key={ticket.id}
                to={`/maintenance-tickets/${ticket.id}`}
                className="block rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 hover:bg-slate-100"
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
      {error && <p className="mt-4 text-sm text-rose-600">{error.message}</p>}
    </div>
  );
}
