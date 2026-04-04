import { useQuery } from "@tanstack/react-query";

import { getMaintenanceTicketsByAsset } from "../../../api/maintenance";

export function useAssetMaintenance(assetId: number) {
  return useQuery({
    queryKey: ["maintenance-tickets", "asset", assetId],
    queryFn: () => getMaintenanceTicketsByAsset(assetId),
    enabled: Number.isFinite(assetId),
  });
}
