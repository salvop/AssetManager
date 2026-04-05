import { NavLink, Outlet, useNavigate } from "react-router-dom";
import type { ComponentType, SVGProps } from "react";

import { Badge } from "./ui/badge";
import {
  AssetRequestIcon,
  AssetIcon,
  DashboardIcon,
  LicenseIcon,
  LookupIcon,
  MaintenanceIcon,
  PeopleIcon,
  SettingsIcon,
  UsersAdminIcon,
} from "./ui/icons";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { useDashboardSummary } from "@/features/dashboard/hooks/useDashboardSummary";
import { clearAccessToken } from "@/lib/session";

type NavItem = {
  to: string;
  label: string;
  badgeValue?: number;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

export function AppShell() {
  const navigate = useNavigate();
  const { data: currentUser } = useCurrentUser();
  const { data: dashboardSummary } = useDashboardSummary();
  const isAdmin = currentUser?.role_codes.includes("ADMIN") ?? false;
  const alertsCount = dashboardSummary?.total_notifications ?? 0;
  const openTicketsCount = dashboardSummary?.open_maintenance_tickets ?? 0;
  const pendingAssignmentsCount = (dashboardSummary?.assignments_due_soon ?? 0) + (dashboardSummary?.overdue_assignments ?? 0);

  const navSections: NavSection[] = [
    {
      title: "Operativita",
      items: [
        { to: "/dashboard", label: "Dashboard", badgeValue: alertsCount, icon: DashboardIcon },
        { to: "/assets", label: "Asset", badgeValue: pendingAssignmentsCount, icon: AssetIcon },
        { to: "/asset-requests", label: "Richieste asset", icon: AssetRequestIcon },
        { to: "/employees-directory", label: "Persone", icon: PeopleIcon },
        { to: "/software-licenses", label: "Licenze software", icon: LicenseIcon },
        { to: "/maintenance-tickets", label: "Manutenzione", badgeValue: openTicketsCount, icon: MaintenanceIcon },
      ],
    },
    {
      title: "Configurazione",
      items: [
        { to: "/lookups", label: "Tabelle", icon: LookupIcon },
        ...(isAdmin ? [{ to: "/users", label: "Utenti", icon: UsersAdminIcon }, { to: "/settings", label: "Impostazioni", icon: SettingsIcon }] : []),
      ],
    },
  ];

  return (
    <div className="min-h-screen text-slate-900">
      <a
        href="#main-content"
        className="sr-only z-50 rounded-xl bg-slate-950 px-3 py-2 text-sm font-semibold text-white focus:not-sr-only focus:absolute focus:left-4 focus:top-4"
      >
        Vai al contenuto principale
      </a>
      <div className="grid min-h-screen grid-cols-[280px_1fr] gap-8 p-5 xl:p-7">
        <aside className="app-panel flex flex-col">
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-brand-700">Enterprise Ops</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">OpsAsset</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">Inventario, lifecycle, manutenzione e audit in un unico workspace.</p>
          </div>
          <nav className="space-y-5" aria-label="Navigazione principale">
            {navSections.map((section) => (
              <div key={section.title}>
                <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">{section.title}</p>
                <div className="space-y-2">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) =>
                        [
                          "flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold transition-colors",
                          isActive
                            ? "bg-slate-950 text-white"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                        ].join(" ")
                      }
                    >
                      <span className="inline-flex items-center gap-2.5">
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </span>
                      {(item.badgeValue ?? 0) > 0 && (
                        <Badge tone="neutral" className="bg-white/90 text-slate-800 tabular-nums">
                          {item.badgeValue}
                        </Badge>
                      )}
                    </NavLink>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
          <div className="mt-auto rounded-[22px] border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700">
                {(currentUser?.full_name ?? "U").trim().charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">{currentUser?.full_name ?? "Sessione attiva"}</p>
                <p className="mt-0.5 text-xs text-slate-500">{currentUser?.role_codes.join(", ") ?? "Ruolo non disponibile"}</p>
              </div>
            </div>
            <div className="mt-3">
              <NavLink
                to="/preferences"
                className="inline-flex w-full items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
              >
                Preferenze utente
              </NavLink>
            </div>
            <button
              className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
              onClick={() => {
                clearAccessToken();
                navigate("/login");
              }}
            >
              Esci
            </button>
          </div>
        </aside>
        <main id="main-content" className="rounded-[32px] border border-slate-200 bg-[rgba(255,255,255,0.55)] p-6 xl:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
