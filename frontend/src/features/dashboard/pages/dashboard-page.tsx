import { Link } from "react-router-dom";
import { useMemo, type ComponentType, type SVGProps } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { Panel } from "@/components/layout/panel";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Empty, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { AssetIcon, LicenseIcon, MaintenanceIcon, PeopleIcon, PlusIcon } from "@/components/ui/icons";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardSummary } from "@/features/dashboard/hooks/useDashboardSummary";

export function DashboardPage() {
  const { data, isLoading, error } = useDashboardSummary();
  const updatedAtLabel = useMemo(
    () => new Intl.DateTimeFormat("it-IT", { hour: "2-digit", minute: "2-digit" }).format(new Date()),
    [],
  );

  const cards = [
    { title: "Asset totali", value: data?.total_assets ?? "--" },
    { title: "Asset assegnati", value: data?.assigned_assets ?? "--" },
    { title: "Ticket aperti", value: data?.open_maintenance_tickets ?? "--" },
    { title: "Attenzioni aperte", value: data?.total_notifications ?? "--" },
  ];

  const workflow = [
    { title: "Registra asset", description: "Crea un nuovo bene.", to: "/assets/new", count: null, icon: PlusIcon },
    { title: "Assegna asset", description: "Beni pronti per consegna.", to: "/assets", count: data?.assets_ready_for_assignment.length ?? 0, icon: AssetIcon },
    { title: "Registra rientro", description: "Rientri da verificare.", to: "/assets", count: (data?.assignments_due_soon ?? 0) + (data?.overdue_assignments ?? 0), icon: PeopleIcon },
    { title: "Gestisci licenze", description: "Disponibilita e scadenze.", to: "/software-licenses", count: (data?.notifications ?? []).filter((item) => item.category === "SOFTWARE_LICENSE").length, icon: LicenseIcon },
    { title: "Apri ticket", description: "Guasti e interventi.", to: "/maintenance-tickets", count: data?.open_maintenance_tickets ?? 0, icon: MaintenanceIcon },
  ];

  const attention = [
    ...(data?.lifecycle_alerts ?? []).slice(0, 3).map((item) => ({
      key: `l-${item.asset_id}-${item.alert_type}`,
      title: item.asset_name,
      subtitle: `${item.asset_tag} · ${item.due_date}`,
      meta: `${item.days_remaining} gg`,
      to: `/assets/${item.asset_id}`,
      tone: "warning" as const,
    })),
    ...(data?.assignment_alerts ?? []).slice(0, 3).map((item) => ({
      key: `a-${item.asset_id}-${item.expected_return_at}`,
      title: item.asset_name,
      subtitle: `${item.asset_tag} · ${item.assigned_employee_name}`,
      meta: item.days_remaining < 0 ? `${Math.abs(item.days_remaining)} gg oltre` : `${item.days_remaining} gg`,
      to: `/assets/${item.asset_id}/assignments`,
      tone: item.days_remaining < 0 ? ("danger" as const) : ("warning" as const),
    })),
  ].slice(0, 6);

  const totalAssets = data?.total_assets ?? 0;
  const kpi = [
    { key: "assigned", label: "Asset assegnati", value: data?.assigned_assets ?? 0 },
    { key: "maintenance", label: "In manutenzione", value: data?.assets_in_maintenance ?? 0 },
    { key: "tickets", label: "Ticket aperti", value: data?.open_maintenance_tickets ?? 0 },
    { key: "alerts", label: "Attenzioni attive", value: data?.total_notifications ?? 0 },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Dashboard"
        title="Panoramica operativa"
        description="Priorita operative, code di lavoro e segnali critici in una sola vista."
        actions={(
          <div className="flex flex-wrap items-center gap-2">
            <p className="mr-1 text-xs text-muted-foreground">Aggiornato alle {updatedAtLabel}</p>
            <QuickLink to="/assets/new" title="Nuovo asset" icon={PlusIcon} primary />
            <QuickLink to="/assets" title="Inventario" icon={AssetIcon} />
            <QuickLink to="/software-licenses" title="Licenze software" icon={LicenseIcon} />
            <QuickLink to="/maintenance-tickets" title="Manutenzione" icon={MaintenanceIcon} />
          </div>
        )}
      />

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Dashboard non disponibile</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Panel key={card.title} className="h-full">
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{card.title}</p>
            {isLoading ? (
              <Skeleton className="mt-2 h-10 w-24 rounded-xl" />
            ) : (
              <p className="mt-2 text-4xl font-semibold tracking-tight tabular-nums text-foreground">{card.value}</p>
            )}
          </Panel>
        ))}
      </div>

      <Panel eyebrow="Workflow" title="Attivita principali">
        <div className="grid gap-3 xl:grid-cols-5">
          {workflow.map((item) => (
            <Link key={item.title} to={item.to} className="block rounded-xl border bg-muted/20 p-4 transition-colors hover:bg-accent">
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-2">
                  <p className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
                    <item.icon className="h-4 w-4 text-muted-foreground" />
                    {item.title}
                  </p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
                {item.count !== null ? <Badge tone="neutral">{isLoading ? "…" : item.count}</Badge> : null}
              </div>
            </Link>
          ))}
        </div>
      </Panel>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel eyebrow="Attenzioni" title="Da presidiare">
          <div className="flex flex-col gap-2">
            {attention.map((item) => (
              <Link key={item.key} to={item.to} className="block rounded-xl border bg-muted/20 p-3 transition-colors hover:bg-accent">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium text-foreground">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.subtitle}</p>
                  </div>
                  <Badge tone={item.tone}>{item.meta}</Badge>
                </div>
              </Link>
            ))}
            {!isLoading && attention.length === 0 ? (
              <Empty>
                <EmptyHeader>
                  <EmptyTitle>Nessuna attenzione operativa aperta</EmptyTitle>
                </EmptyHeader>
              </Empty>
            ) : null}
          </div>
        </Panel>

        <Panel eyebrow="KPI" title="Trend operativo istantaneo">
          <div className="flex flex-col gap-3">
            {kpi.map((item) => (
              <KpiRow key={item.key} label={item.label} value={item.value} total={totalAssets} loading={isLoading} />
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function KpiRow({ label, value, total, loading }: { label: string; value: number; total: number; loading: boolean }) {
  const pct = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;
  return (
    <div className="rounded-xl border bg-background p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-sm font-semibold tabular-nums text-foreground">
          {loading ? "…" : value} <span className="text-muted-foreground">({loading ? "…" : `${pct}%`})</span>
        </p>
      </div>
      <Progress className="mt-2" value={pct} />
    </div>
  );
}

function QuickLink({
  to,
  title,
  icon: Icon,
  primary = false,
}: {
  to: string;
  title: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  primary?: boolean;
}) {
  return (
    <Button asChild variant={primary ? "default" : "outline"} size="sm" className="rounded-full">
      <Link to={to}>
        <Icon className="h-4 w-4" />
        {title}
      </Link>
    </Button>
  );
}
