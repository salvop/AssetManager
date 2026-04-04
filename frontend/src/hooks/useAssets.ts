import { useQuery } from "@tanstack/react-query";

import { getAsset, getAssets } from "../api/assets";

type UseAssetsFilters = {
  search?: string;
  statusId?: number;
  categoryId?: number;
  locationId?: number;
};

export function useAssets(filters: UseAssetsFilters) {
  return useQuery({
    queryKey: ["assets", filters],
    queryFn: () => getAssets(filters),
  });
}

export function useAsset(assetId: number) {
  return useQuery({
    queryKey: ["asset", assetId],
    queryFn: () => getAsset(assetId),
    enabled: Number.isFinite(assetId),
  });
}
