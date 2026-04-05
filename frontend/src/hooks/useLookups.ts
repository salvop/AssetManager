import { useQueries } from "@tanstack/react-query";

import {
  getAssetCategories,
  getAssetModels,
  getAssetStatuses,
  getDepartments,
  getLocations,
  getVendors,
} from "../api/lookups";
import { getEmployees } from "../api/employees";
import { getUsers } from "../api/users";

type LookupBundleOptions = {
  departments?: boolean;
  locations?: boolean;
  vendors?: boolean;
  categories?: boolean;
  models?: boolean;
  statuses?: boolean;
  employees?: boolean;
  users?: boolean;
};

const LOOKUP_STALE_TIME_MS = 5 * 60 * 1000;

const defaultOptions: Required<LookupBundleOptions> = {
  departments: true,
  locations: true,
  vendors: true,
  categories: true,
  models: true,
  statuses: true,
  employees: true,
  users: true,
};

export function useLookupsBundle(options?: LookupBundleOptions) {
  const resolvedOptions = { ...defaultOptions, ...options };

  const results = useQueries({
    queries: [
      { queryKey: ["departments"], queryFn: getDepartments, enabled: resolvedOptions.departments, staleTime: LOOKUP_STALE_TIME_MS },
      { queryKey: ["locations"], queryFn: getLocations, enabled: resolvedOptions.locations, staleTime: LOOKUP_STALE_TIME_MS },
      { queryKey: ["vendors"], queryFn: getVendors, enabled: resolvedOptions.vendors, staleTime: LOOKUP_STALE_TIME_MS },
      { queryKey: ["asset-categories"], queryFn: getAssetCategories, enabled: resolvedOptions.categories, staleTime: LOOKUP_STALE_TIME_MS },
      { queryKey: ["asset-models"], queryFn: getAssetModels, enabled: resolvedOptions.models, staleTime: LOOKUP_STALE_TIME_MS },
      { queryKey: ["asset-statuses"], queryFn: getAssetStatuses, enabled: resolvedOptions.statuses, staleTime: LOOKUP_STALE_TIME_MS },
      { queryKey: ["employees"], queryFn: () => getEmployees(), enabled: resolvedOptions.employees, staleTime: LOOKUP_STALE_TIME_MS },
      { queryKey: ["users"], queryFn: () => getUsers(), enabled: resolvedOptions.users, staleTime: LOOKUP_STALE_TIME_MS },
    ],
  });

  const enabledFlags = Object.values(resolvedOptions);

  return {
    departments: results[0].data?.items ?? [],
    locations: results[1].data?.items ?? [],
    vendors: results[2].data?.items ?? [],
    categories: results[3].data?.items ?? [],
    models: results[4].data?.items ?? [],
    statuses: results[5].data?.items ?? [],
    employees: results[6].data?.items ?? [],
    users: results[7].data?.items ?? [],
    isLoading: results.some((item, index) => enabledFlags[index] && item.isLoading),
    error: results.find((item, index) => enabledFlags[index] && item.error)?.error ?? null,
  };
}
