import { apiRequest } from "@/api/http";
import type { DashboardSummary } from "@/types/api";

export function getDashboardSummary(): Promise<DashboardSummary> {
  return apiRequest<DashboardSummary>("/dashboard/summary");
}
