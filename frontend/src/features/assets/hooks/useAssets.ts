import { useQuery } from "@tanstack/react-query";

import { getAsset, getAssets } from "@/features/assets/api/assets";

type UseAssetsFilters = {
  search?: string;
  statusId?: number;
  categoryId?: number;
  locationId?: number;
  page?: number;
  pageSize?: number;
  sortBy?: "asset_tag" | "name" | "created_at" | "updated_at";
  sortDir?: "asc" | "desc";
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
