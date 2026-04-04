import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAssets } from "../hooks/useAssets";
import { useLookupsBundle } from "../hooks/useLookups";

const statusToneMap: Record<string, string> = {
  IN_STOCK: "bg-emerald-100 text-emerald-800",
  ASSIGNED: "bg-blue-100 text-blue-800",
  MAINTENANCE: "bg-amber-100 text-amber-800",
  RETIRED: "bg-slate-200 text-slate-700",
  DISPOSED: "bg-rose-100 text-rose-700",
};

export function AssetListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusId, setStatusId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [locationId, setLocationId] = useState("");
  const { statuses, categories, locations } = useLookupsBundle();
  const { data, isLoading, error } = useAssets({
    search,
    statusId: statusId ? Number(statusId) : undefined,
    categoryId: categoryId ? Number(categoryId) : undefined,
    locationId: locationId ? Number(locationId) : undefined,
  });

  return (
    <div>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-700">Inventario</p>
          <h2 className="mt-2 text-3xl font-semibold">Asset</h2>
        </div>
        <Link to="/assets/new" className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white">
          Nuovo asset
        </Link>
      </div>
      <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-4 md:grid-cols-4">
          <input
            className="rounded-md border border-slate-300 px-3 py-2"
            placeholder="Cerca per tag o nome asset"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <select
            value={statusId}
            onChange={(event) => setStatusId(event.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2"
          >
            <option value="">Tutti gli stati</option>
            {statuses.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <select
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2"
          >
            <option value="">Tutte le categorie</option>
            {categories.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <select
            value={locationId}
            onChange={(event) => setLocationId(event.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2"
          >
            <option value="">Tutte le sedi</option>
            {locations.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
          <p>{data?.total ?? 0} asset trovati</p>
          <button
            onClick={() => {
              setSearch("");
              setStatusId("");
              setCategoryId("");
              setLocationId("");
            }}
            className="font-medium text-brand-700"
          >
            Azzera filtri
          </button>
        </div>
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr className="text-left text-sm text-slate-500">
              <th className="px-4 py-3 font-medium">Tag asset</th>
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">Stato</th>
              <th className="px-4 py-3 font-medium">Sede</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {(data?.items ?? []).map((asset) => (
              <tr
                key={asset.id}
                className="cursor-pointer text-sm hover:bg-slate-50"
                onClick={() => navigate(`/assets/${asset.id}`)}
              >
                <td className="px-4 py-3 font-medium text-slate-900">{asset.asset_tag}</td>
                <td className="px-4 py-3 text-slate-700">{asset.name}</td>
                <td className="px-4 py-3">
                  <span
                    className={[
                      "rounded-full px-2.5 py-1 text-xs font-semibold",
                      statusToneMap[asset.status.code ?? ""] ?? "bg-brand-100 text-brand-800",
                    ].join(" ")}
                  >
                    {asset.status.code ?? asset.status.name}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-700">{asset.location?.name ?? "-"}</td>
              </tr>
            ))}
            {!isLoading && (data?.items ?? []).length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-sm text-slate-500">
                  Nessun asset corrisponde ai filtri correnti.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {isLoading && <p className="mt-4 text-sm text-slate-500">Caricamento asset...</p>}
      {error && <p className="mt-4 text-sm text-rose-600">{error.message}</p>}
    </div>
  );
}
