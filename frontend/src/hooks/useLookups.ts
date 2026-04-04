import { useQueries } from "@tanstack/react-query";

import {
  getAssetCategories,
  getAssetModels,
  getAssetStatuses,
  getDepartments,
  getLocations,
  getVendors,
} from "../api/lookups";
import { getUsers } from "../api/users";

export function useLookupsBundle() {
  const results = useQueries({
    queries: [
      { queryKey: ["departments"], queryFn: getDepartments },
      { queryKey: ["locations"], queryFn: getLocations },
      { queryKey: ["vendors"], queryFn: getVendors },
      { queryKey: ["asset-categories"], queryFn: getAssetCategories },
      { queryKey: ["asset-models"], queryFn: getAssetModels },
      { queryKey: ["asset-statuses"], queryFn: getAssetStatuses },
      { queryKey: ["users"], queryFn: getUsers },
    ],
  });

  return {
    departments: results[0].data?.items ?? [],
    locations: results[1].data?.items ?? [],
    vendors: results[2].data?.items ?? [],
    categories: results[3].data?.items ?? [],
    models: results[4].data?.items ?? [],
    statuses: results[5].data?.items ?? [],
    users: results[6].data?.items ?? [],
    isLoading: results.some((item) => item.isLoading),
    error: results.find((item) => item.error)?.error ?? null,
  };
}
