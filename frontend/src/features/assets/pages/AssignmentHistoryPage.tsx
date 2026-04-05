import { Link, useParams } from "react-router-dom";

import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { useAsset } from "@/features/assets/hooks/useAssets";

export function AssignmentHistoryPage() {
  const params = useParams();
  const assetId = Number(params.assetId);
  const { data: asset, isLoading, error } = useAsset(assetId);

  if (isLoading) return <p className="text-sm text-slate-500" aria-live="polite">Caricamento storico assegnazioni…</p>;
  if (error || !asset) return <p className="text-sm text-rose-600">{error?.message ?? "Asset non trovato"}</p>;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Storico assegnazioni"
        title={asset.asset_tag}
        description="Tracciabilita completa delle assegnazioni e dei rientri registrati."
        actions={(
          <Link to={`/assets/${asset.id}`} className="text-sm font-medium text-brand-700">
            Torna all'asset
          </Link>
        )}
      />

      <Panel className="overflow-hidden p-0">
        <table className="min-w-full divide-y divide-slate-200">
          <caption className="sr-only">Storico assegnazioni e rientri dell'asset</caption>
          <thead className="bg-slate-50">
            <tr className="text-left text-sm text-slate-500">
              <th scope="col" className="px-4 py-3 font-medium">Assegnatario</th>
              <th scope="col" className="px-4 py-3 font-medium">Assegnato il</th>
              <th scope="col" className="px-4 py-3 font-medium">Rientrato il</th>
              <th scope="col" className="px-4 py-3 font-medium">Sede</th>
              <th scope="col" className="px-4 py-3 font-medium">Dipartimento</th>
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
      </Panel>
    </div>
  );
}
