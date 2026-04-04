import { NavLink, Outlet, useNavigate } from "react-router-dom";

import { useDashboardSummary } from "../hooks/useDashboardSummary";
import { clearAccessToken } from "../lib/session";
import { useCurrentUser } from "../hooks/useCurrentUser";

const baseNavItems = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/assets", label: "Asset" },
  { to: "/maintenance-tickets", label: "Manutenzione" },
  { to: "/lookups", label: "Tabelle" },
];

export function AppShell() {
  const navigate = useNavigate();
  const { data: currentUser } = useCurrentUser();
  const { data: dashboardSummary } = useDashboardSummary();
  const isAdmin = currentUser?.role_codes.includes("ADMIN") ?? false;
  const navItems = isAdmin ? [...baseNavItems, { to: "/users", label: "Utenti" }] : baseNavItems;

  return (
    <div className="min-h-screen text-slate-900">
      <div className="grid min-h-screen grid-cols-[280px_1fr] gap-8 p-5 xl:p-7">
        <aside className="app-panel flex flex-col">
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-brand-700">Enterprise Ops</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">Asset Manager</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">Inventario, lifecycle, manutenzione e audit in un unico workspace.</p>
          </div>
          <nav className="space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  [
                    "block rounded-2xl px-4 py-3 text-sm font-semibold transition-colors",
                    isActive
                      ? "bg-slate-950 text-white"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                  ].join(" ")
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="mt-8 rounded-[24px] border border-slate-200 bg-slate-50 p-4 text-sm">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-slate-900">Notifiche interne</p>
              <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                {dashboardSummary?.total_notifications ?? 0}
              </span>
            </div>
            <div className="mt-3 space-y-2">
              {(dashboardSummary?.notifications ?? []).slice(0, 3).map((notification) => (
                <NavLink
                  key={`${notification.category}-${notification.title}-${notification.link}`}
                  to={notification.link}
                  className="block rounded-2xl bg-white px-3 py-3 text-xs text-slate-700 ring-1 ring-slate-200 transition-colors hover:border-slate-300"
                >
                  <p className="font-semibold text-slate-900">{notification.title}</p>
                  <p className="mt-1 text-slate-500">{notification.body}</p>
                </NavLink>
              ))}
              {!(dashboardSummary?.notifications?.length) && (
                <p className="text-xs text-slate-500">Nessuna attenzione operativa aperta.</p>
              )}
            </div>
          </div>
          <div className="mt-auto rounded-[24px] border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            <p className="font-semibold text-slate-900">{currentUser?.full_name ?? "Sessione attiva"}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">{currentUser?.role_codes.join(", ") ?? ""}</p>
            <button
              className="mt-4 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-brand-700 transition-colors hover:bg-slate-100"
              onClick={() => {
                clearAccessToken();
                navigate("/login");
              }}
            >
              Esci
            </button>
          </div>
        </aside>
        <main className="rounded-[32px] border border-slate-200 bg-[rgba(255,255,255,0.55)] p-6 xl:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
