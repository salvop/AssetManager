import { useQuery } from "@tanstack/react-query";

import { getDashboardSummary } from "../api/dashboard";
import { getAccessToken } from "../lib/session";

export function useDashboardSummary() {
  return useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: getDashboardSummary,
    enabled: Boolean(getAccessToken()),
  });
}
