import { Link, useSearchParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";

import { exportAssetsCsv, exportAssetsXlsx } from "../../../api/assets";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { PageHeader } from "../../../components/ui/page-header";
import { Panel } from "../../../components/ui/panel";
import { Select } from "../../../components/ui/select";
import { useLookupsBundle } from "../../../hooks/useLookups";
import { useAssets } from "../hooks/useAssets";

const statusToneMap: Record<string, "success" | "info" | "warning" | "neutral" | "danger"> = {
  IN_STOCK: "success",
  ASSIGNED: "info",
  MAINTENANCE: "warning",
  RETIRED: "neutral",
  DISPOSED: "danger",
};

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
    mutationFn: () =>
      exportAssetsCsv({
        search,
        statusId: statusId ? Number(statusId) : undefined,
        categoryId: categoryId ? Number(categoryId) : undefined,
        locationId: locationId ? Number(locationId) : undefined,
      }),
  });
  const exportExcelMutation = useMutation({
    mutationFn: () =>
      exportAssetsXlsx({
        search,
        statusId: statusId ? Number(statusId) : undefined,
        categoryId: categoryId ? Number(categoryId) : undefined,
        locationId: locationId ? Number(locationId) : undefined,
      }),
  });
  const { data, isLoading, error } = useAssets({
    search,
    statusId: statusId ? Number(statusId) : undefined,
    categoryId: categoryId ? Number(categoryId) : undefined,
    locationId: locationId ? Number(locationId) : undefined,
  });

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
            <Select
              id="asset-filter-status"
              name="asset-filter-status"
              value={statusId}
              onChange={(event) => setFilterParam("status_id", event.target.value)}
            >
              <option value="">Tutti gli stati</option>
              {statuses.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
          </label>
          <label htmlFor="asset-filter-category" className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Categoria</span>
            <Select
              id="asset-filter-category"
              name="asset-filter-category"
              value={categoryId}
              onChange={(event) => setFilterParam("category_id", event.target.value)}
            >
              <option value="">Tutte le categorie</option>
              {categories.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
          </label>
          <label htmlFor="asset-filter-location" className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Sede</span>
            <Select
              id="asset-filter-location"
              name="asset-filter-location"
              value={locationId}
              onChange={(event) => setFilterParam("location_id", event.target.value)}
            >
              <option value="">Tutte le sedi</option>
              {locations.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
          </label>
        </div>
      </Panel>

      <Panel className="overflow-hidden p-0">
        <div className="border-b border-slate-200/80 px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Vista tabellare</p>
          <h3 className="mt-2 text-lg font-semibold text-slate-900">Inventario corrente</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200/80">
            <caption className="sr-only">Elenco asset con stato, sede e informazioni lifecycle</caption>
            <thead className="bg-slate-50/80">
              <tr className="text-left text-xs uppercase tracking-[0.18em] text-slate-500">
                <th scope="col" className="px-6 py-4 font-semibold">Tag asset</th>
                <th scope="col" className="px-6 py-4 font-semibold">Nome</th>
                <th scope="col" className="px-6 py-4 font-semibold">Stato</th>
                <th scope="col" className="px-6 py-4 font-semibold">Sede</th>
                <th scope="col" className="px-6 py-4 font-semibold">Lifecycle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80">
              {(data?.items ?? []).map((asset) => (
                <tr key={asset.id} className="text-sm transition hover:bg-brand-50/50">
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <Link to={`/assets/${asset.id}`} className="font-semibold text-slate-900 hover:underline focus-visible:underline">
                        {asset.asset_tag}
                      </Link>
                      {asset.serial_number && <p className="text-xs text-slate-500">{asset.serial_number}</p>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <p className="font-medium text-slate-800">{asset.name}</p>
                      <p className="text-xs text-slate-500">
                        {[asset.asset_type, asset.brand, asset.category.name, asset.assigned_employee?.full_name].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge tone={statusToneMap[asset.status.code ?? ""] ?? "neutral"}>
                      {asset.status.code ?? asset.status.name}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-slate-700">{asset.location?.name ?? "-"}</td>
                  <td className="px-6 py-4 text-slate-700">
                    <div className="space-y-1.5">
                      {asset.location_floor && <p className="text-xs text-slate-500">Piano: {asset.location_floor}</p>}
                      {asset.location_room && <p className="text-xs text-slate-500">Stanza: {asset.location_room}</p>}
                      {asset.location_rack && <p className="text-xs text-slate-500">Rack: {asset.location_rack}</p>}
                      {asset.location_slot && <p className="text-xs text-slate-500">Slot: {asset.location_slot}</p>}
                      {asset.cost_center && <p className="text-xs text-slate-500">Cost center: {asset.cost_center}</p>}
                      {asset.warranty_expiry_date && (
                        <p className="text-xs text-slate-500">Garanzia: {asset.warranty_expiry_date}</p>
                      )}
                      {asset.expected_end_of_life_date && (
                        <p className="text-xs text-slate-500">Fine vita: {asset.expected_end_of_life_date}</p>
                      )}
                      {!asset.location_floor &&
                        !asset.location_room &&
                        !asset.location_rack &&
                        !asset.location_slot &&
                        !asset.cost_center &&
                        !asset.warranty_expiry_date &&
                        !asset.expected_end_of_life_date &&
                        "-"}
                    </div>
                  </td>
                </tr>
              ))}
              {!isLoading && (data?.items ?? []).length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-sm text-slate-500">
                    Nessun asset corrisponde ai filtri correnti.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
