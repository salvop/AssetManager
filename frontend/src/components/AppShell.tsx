import { NavLink, Outlet, useNavigate } from "react-router-dom";
import type { ComponentType, SVGProps } from "react";

import { Badge } from "./ui/badge";
import {
  AssetIcon,
  DashboardIcon,
  LicenseIcon,
  LookupIcon,
  MaintenanceIcon,
  PeopleIcon,
  PreferencesIcon,
  SettingsIcon,
  UsersAdminIcon,
} from "./ui/icons";
import { useDashboardSummary } from "../hooks/useDashboardSummary";
import { clearAccessToken } from "../lib/session";
import { useCurrentUser } from "../hooks/useCurrentUser";

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
        { to: "/employees-directory", label: "Persone", icon: PeopleIcon },
        { to: "/software-licenses", label: "Licenze software", icon: LicenseIcon },
        { to: "/maintenance-tickets", label: "Manutenzione", badgeValue: openTicketsCount, icon: MaintenanceIcon },
      ],
    },
    {
      title: "Configurazione",
      items: [
        { to: "/preferences", label: "Preferenze", icon: PreferencesIcon },
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
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">Asset Manager</h1>
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
          <div className="mt-8 rounded-[24px] border border-slate-200 bg-slate-50 p-4 text-sm">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-slate-900">Attenzioni aperte</p>
              <Badge tone="neutral" className="tabular-nums">{alertsCount}</Badge>
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
        <main id="main-content" className="rounded-[32px] border border-slate-200 bg-[rgba(255,255,255,0.55)] p-6 xl:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
