import { Link, useSearchParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";

import { exportAssetsCsv, exportAssetsXlsx } from "@/features/assets/api/assets";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { SelectField } from "@/components/ui/select-field";
import { useLookupsBundle } from "@/features/lookups/hooks/useLookups";
import { AssetDataTable } from "@/features/assets/components/asset-data-table";
import { useAssets } from "@/features/assets/hooks/useAssets";

export function AssetListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get("search") ?? "";
  const statusId = searchParams.get("status_id") ?? "";
  const categoryId = searchParams.get("category_id") ?? "";
  const locationId = searchParams.get("location_id") ?? "";
  const { statuses, categories, locations } = useLookupsBundle({
    statuses: true,
    categories: true,
    locations: true,
    departments: false,
    vendors: false,
    models: false,
    employees: false,
    users: false,
  });

  const listParams = {
    search,
    ...(statusId ? { statusId: Number(statusId) } : {}),
    ...(categoryId ? { categoryId: Number(categoryId) } : {}),
    ...(locationId ? { locationId: Number(locationId) } : {}),
  };

  const setFilterParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    setSearchParams(next, { replace: true });
  };
  const exportMutation = useMutation({
    mutationFn: () => exportAssetsCsv(listParams),
  });
  const exportExcelMutation = useMutation({
    mutationFn: () => exportAssetsXlsx(listParams),
  });
  const { data, isLoading, error } = useAssets(listParams);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Inventario"
        title="Registro asset"
        description="Ricerca, filtra ed esporta il parco asset attuale."
        actions={(
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={() => exportMutation.mutate()}
              disabled={exportMutation.isPending}
            >
              {exportMutation.isPending ? "Esportazione…" : "Esporta CSV"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => exportExcelMutation.mutate()}
              disabled={exportExcelMutation.isPending}
            >
              {exportExcelMutation.isPending ? "Esportazione…" : "Esporta Excel"}
            </Button>
            <Link
              to="/assets/new"
              className="inline-flex items-center rounded-2xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
            >
              Nuovo asset
            </Link>
          </>
        )}
      />

      <Panel eyebrow="Filtri" title="Ricerca & segmentazione">
        <div className="flex items-center justify-end gap-3 text-sm">
          <Badge tone="neutral" className="bg-slate-950 text-white">
            {data?.total ?? 0} asset
          </Badge>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setSearchParams(new URLSearchParams(), { replace: true });
            }}
          >
            Azzera filtri
          </Button>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label htmlFor="asset-filter-search" className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Ricerca</span>
            <Input
              id="asset-filter-search"
              name="asset-filter-search"
              placeholder="Cerca per tag o nome asset…"
              value={search}
              onChange={(event) => setFilterParam("search", event.target.value)}
            />
          </label>
          <label htmlFor="asset-filter-status" className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Stato</span>
            <SelectField
              value={statusId}
              onValueChange={(value) => setFilterParam("status_id", value)}
              placeholder="Tutti gli stati"
              options={statuses.map((item) => ({ value: String(item.id), label: item.name }))}
            />
          </label>
          <label htmlFor="asset-filter-category" className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Categoria</span>
            <SelectField
              value={categoryId}
              onValueChange={(value) => setFilterParam("category_id", value)}
              placeholder="Tutte le categorie"
              options={categories.map((item) => ({ value: String(item.id), label: item.name }))}
            />
          </label>
          <label htmlFor="asset-filter-location" className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Sede</span>
            <SelectField
              value={locationId}
              onValueChange={(value) => setFilterParam("location_id", value)}
              placeholder="Tutte le sedi"
              options={locations.map((item) => ({ value: String(item.id), label: item.name }))}
            />
          </label>
        </div>
      </Panel>

      <Panel className="overflow-hidden p-0">
        <div className="border-b border-slate-200/80 px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Vista tabellare</p>
          <h3 className="mt-2 text-lg font-semibold text-slate-900">Inventario corrente</h3>
        </div>
        <div className="px-6 py-5">
          <AssetDataTable data={data?.items ?? []} />
        </div>
      </Panel>

      {isLoading && <p className="text-sm text-slate-500">Caricamento asset…</p>}
      {(exportMutation.error || exportExcelMutation.error) && (
        <p className="text-sm text-rose-600">
          {exportMutation.error?.message || exportExcelMutation.error?.message}
        </p>
      )}
      {error && <p className="text-sm text-rose-600">{error.message}</p>}
    </div>
  );
}
