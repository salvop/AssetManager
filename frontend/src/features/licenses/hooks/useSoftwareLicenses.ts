import { useQuery } from "@tanstack/react-query";

import { getSoftwareLicense, getSoftwareLicenses } from "@/features/licenses/api/softwareLicenses";

export function useSoftwareLicenses(search?: string) {
  return useQuery({
    queryKey: ["software-licenses", search ?? ""],
    queryFn: () => getSoftwareLicenses(search),
  });
}

export function useSoftwareLicense(licenseId: number) {
  return useQuery({
    queryKey: ["software-license", licenseId],
    queryFn: () => getSoftwareLicense(licenseId),
    enabled: Number.isFinite(licenseId),
  });
}
