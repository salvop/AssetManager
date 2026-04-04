import { Link, useSearchParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";

import { exportAssetsCsv, exportAssetsXlsx } from "../../../api/assets";
import { useLookupsBundle } from "../../../hooks/useLookups";
import { useAssets } from "../hooks/useAssets";

const statusToneMap: Record<string, string> = {
  IN_STOCK: "bg-emerald-100 text-emerald-800",
  ASSIGNED: "bg-blue-100 text-blue-800",
  MAINTENANCE: "bg-amber-100 text-amber-800",
  RETIRED: "bg-slate-200 text-slate-700",
  DISPOSED: "bg-rose-100 text-rose-700",
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
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-700">Inventario</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Registro asset</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">Ricerca, filtra ed esporta il parco asset attuale.</p>
        </div>
        <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => exportMutation.mutate()}
              disabled={exportMutation.isPending}
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              {exportMutation.isPending ? "Esportazione…" : "Esporta CSV"}
            </button>
            <button
              type="button"
              onClick={() => exportExcelMutation.mutate()}
              disabled={exportExcelMutation.isPending}
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              {exportExcelMutation.isPending ? "Esportazione…" : "Esporta Excel"}
            </button>
            <Link
              to="/assets/new"
              className="rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-900"
            >
              Nuovo asset
            </Link>
        </div>
      </div>

      <section className="app-panel">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Filtri</p>
            <h3 className="mt-2 text-lg font-semibold text-slate-900">Ricerca e segmentazione</h3>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="rounded-full bg-slate-950 px-3 py-1 font-semibold text-white">{data?.total ?? 0} asset</span>
            <button
              onClick={() => {
                setSearchParams(new URLSearchParams(), { replace: true });
              }}
              className="font-medium text-brand-700 transition hover:text-brand-900"
            >
              Azzera filtri
            </button>
          </div>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Ricerca</span>
            <input
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm outline-none transition focus:border-brand-300 focus:ring-4 focus:ring-brand-100"
              placeholder="Cerca per tag o nome asset"
              value={search}
              onChange={(event) => setFilterParam("search", event.target.value)}
            />
          </label>
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Stato</span>
            <select
              value={statusId}
              onChange={(event) => setFilterParam("status_id", event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm outline-none transition focus:border-brand-300 focus:ring-4 focus:ring-brand-100"
            >
              <option value="">Tutti gli stati</option>
              {statuses.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Categoria</span>
            <select
              value={categoryId}
              onChange={(event) => setFilterParam("category_id", event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm outline-none transition focus:border-brand-300 focus:ring-4 focus:ring-brand-100"
            >
              <option value="">Tutte le categorie</option>
              {categories.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Sede</span>
            <select
              value={locationId}
              onChange={(event) => setFilterParam("location_id", event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm outline-none transition focus:border-brand-300 focus:ring-4 focus:ring-brand-100"
            >
              <option value="">Tutte le sedi</option>
              {locations.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="app-panel overflow-hidden p-0">
        <div className="border-b border-slate-200/80 px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Vista tabellare</p>
          <h3 className="mt-2 text-lg font-semibold text-slate-900">Inventario corrente</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200/80">
            <thead className="bg-slate-50/80">
              <tr className="text-left text-xs uppercase tracking-[0.18em] text-slate-500">
                <th className="px-6 py-4 font-semibold">Tag asset</th>
                <th className="px-6 py-4 font-semibold">Nome</th>
                <th className="px-6 py-4 font-semibold">Stato</th>
                <th className="px-6 py-4 font-semibold">Sede</th>
                <th className="px-6 py-4 font-semibold">Lifecycle</th>
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
                    <span
                      className={[
                        "rounded-full px-3 py-1 text-xs font-semibold",
                        statusToneMap[asset.status.code ?? ""] ?? "bg-brand-100 text-brand-800",
                      ].join(" ")}
                    >
                      {asset.status.code ?? asset.status.name}
                    </span>
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
      </section>

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
