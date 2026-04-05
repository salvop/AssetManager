import { useQuery } from "@tanstack/react-query";

import { getSoftwareLicense, getSoftwareLicenses } from "@/features/licenses/api/softwareLicenses";

type UseSoftwareLicensesFilters = {
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: "product_name" | "license_type" | "expiry_date";
  sortDir?: "asc" | "desc";
};

export function useSoftwareLicenses(filters: UseSoftwareLicensesFilters) {
  return useQuery({
    queryKey: ["software-licenses", filters],
    queryFn: () => getSoftwareLicenses(filters),
  });
}

export function useSoftwareLicense(licenseId: number) {
  return useQuery({
    queryKey: ["software-license", licenseId],
    queryFn: () => getSoftwareLicense(licenseId),
    enabled: Number.isFinite(licenseId),
  });
}
