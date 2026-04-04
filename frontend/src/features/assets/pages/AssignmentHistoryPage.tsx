import { Link, useParams } from "react-router-dom";

import { useAsset } from "../hooks/useAssets";

export function AssignmentHistoryPage() {
  const params = useParams();
  const assetId = Number(params.assetId);
  const { data: asset, isLoading, error } = useAsset(assetId);

  if (isLoading) return <p className="text-sm text-slate-500">Caricamento storico assegnazioni...</p>;
  if (error || !asset) return <p className="text-sm text-rose-600">{error?.message ?? "Asset non trovato"}</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-700">Storico assegnazioni</p>
          <h2 className="mt-2 text-3xl font-semibold">{asset.asset_tag}</h2>
        </div>
        <Link to={`/assets/${asset.id}`} className="text-sm font-medium text-brand-700">
          Torna all'asset
        </Link>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr className="text-left text-sm text-slate-500">
              <th className="px-4 py-3 font-medium">Assegnatario</th>
              <th className="px-4 py-3 font-medium">Assegnato il</th>
              <th className="px-4 py-3 font-medium">Rientrato il</th>
              <th className="px-4 py-3 font-medium">Sede</th>
              <th className="px-4 py-3 font-medium">Dipartimento</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {asset.assignments.map((assignment) => (
              <tr key={assignment.id} className="text-sm">
                <td className="px-4 py-3 text-slate-900">{assignment.employee.full_name}</td>
                <td className="px-4 py-3 text-slate-700">{new Date(assignment.assigned_at).toLocaleString()}</td>
                <td className="px-4 py-3 text-slate-700">{assignment.returned_at ? new Date(assignment.returned_at).toLocaleString() : "Aperta"}</td>
                <td className="px-4 py-3 text-slate-700">{assignment.location?.name ?? "-"}</td>
                <td className="px-4 py-3 text-slate-700">{assignment.department?.name ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
