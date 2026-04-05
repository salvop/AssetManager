import type { ComponentType, SVGProps } from "react";
import { NavLink, Outlet } from "react-router-dom";

import { Brand } from "@/components/layout/brand";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
} from "@/components/ui/icons";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

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

export type AppShellUser = {
  fullName: string;
  roleCodes: string[];
};

export type AppShellSummary = {
  totalNotifications: number;
  openMaintenanceTickets: number;
  assignmentsDueSoon: number;
  overdueAssignments: number;
};

type AppShellProps = {
  currentUser: AppShellUser | undefined;
  dashboardSummary: AppShellSummary | undefined;
  onLogout: () => void;
};

export function AppShell({ currentUser, dashboardSummary, onLogout }: AppShellProps) {
  const isAdmin = currentUser?.roleCodes.includes("ADMIN") ?? false;
  const alertsCount = dashboardSummary?.totalNotifications ?? 0;
  const openTicketsCount = dashboardSummary?.openMaintenanceTickets ?? 0;
  const pendingAssignmentsCount =
    (dashboardSummary?.assignmentsDueSoon ?? 0) +
    (dashboardSummary?.overdueAssignments ?? 0);

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
        ...(isAdmin
          ? [
              { to: "/users", label: "Utenti", icon: UsersAdminIcon },
              { to: "/settings", label: "Impostazioni", icon: SettingsIcon },
            ]
          : []),
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <a
        href="#main-content"
        className="sr-only rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground focus:not-sr-only focus:absolute focus:left-4 focus:top-4"
      >
        Vai al contenuto principale
      </a>
      <div className="grid min-h-screen gap-6 p-4 xl:grid-cols-[304px_minmax(0,1fr)] xl:p-6">
        <Card className="flex h-fit flex-col xl:sticky xl:top-6">
          <CardHeader className="gap-3 pb-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Enterprise Ops
            </p>
            <div className="flex flex-col gap-2">
              <CardTitle>
                <Brand variant="wide" labelClassName="text-3xl" />
              </CardTitle>
              <p className="text-sm leading-6 text-muted-foreground">
                Inventario, lifecycle, manutenzione e audit in un unico workspace.
              </p>
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="flex flex-col gap-6 pt-6">
            <nav className="flex flex-col gap-6 pt-1" aria-label="Navigazione principale">
              {navSections.map((section, index) => (
                <div key={section.title} className="flex flex-col gap-4">
                  {index > 0 ? <Separator /> : null}
                  <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    {section.title}
                  </p>
                  <div className="flex flex-col gap-2.5">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          className={({ isActive }) =>
                            cn(
                              "flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                              "min-h-11",
                              isActive
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                            )
                          }
                        >
                          <span className="inline-flex items-center gap-2.5 leading-none">
                            <Icon className="h-4 w-4 shrink-0" />
                            {item.label}
                          </span>
                          {(item.badgeValue ?? 0) > 0 ? (
                            <Badge tone="neutral" className="min-w-7 justify-center tabular-nums">
                              {item.badgeValue}
                            </Badge>
                          ) : null}
                        </NavLink>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </CardContent>
          <Separator />
          <CardFooter className="flex flex-col items-stretch gap-4 pt-6">
            <div className="flex items-center gap-3 rounded-xl border border-border p-4">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground">
                {(currentUser?.fullName ?? "U").trim().charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">
                  {currentUser?.fullName ?? "Sessione attiva"}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {currentUser?.roleCodes.join(", ") ?? "Ruolo non disponibile"}
                </p>
              </div>
            </div>
            <Button asChild variant="outline" className="h-11 w-full">
              <NavLink to="/preferences">Preferenze utente</NavLink>
            </Button>
            <Button variant="destructive" className="h-11 w-full" onClick={onLogout}>
              Esci
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardContent className="p-6 xl:p-8">
            <main id="main-content">
              <Outlet />
            </main>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
