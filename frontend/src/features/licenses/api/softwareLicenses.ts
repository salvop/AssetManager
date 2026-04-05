import { apiRequest } from "@/api/http";
import type {
  SoftwareLicenseAssignPayload,
  SoftwareLicenseAssignment,
  SoftwareLicenseDetail,
  SoftwareLicenseListResponse,
  SoftwareLicensePayload,
  SoftwareLicenseRevokePayload,
} from "@/types/api";

type SoftwareLicenseListParams = {
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: "product_name" | "license_type" | "expiry_date";
  sortDir?: "asc" | "desc";
};

export function getSoftwareLicenses(params: SoftwareLicenseListParams = {}) {
  const searchParams = new URLSearchParams();
  if (params.search) searchParams.set("search", params.search);
  searchParams.set("page", String(params.page ?? 1));
  searchParams.set("page_size", String(params.pageSize ?? 20));
  if (params.sortBy) searchParams.set("sort_by", params.sortBy);
  if (params.sortDir) searchParams.set("sort_dir", params.sortDir);
  return apiRequest<SoftwareLicenseListResponse>(`/software-licenses?${searchParams.toString()}`);
}

export function getSoftwareLicense(licenseId: number) {
  return apiRequest<SoftwareLicenseDetail>(`/software-licenses/${licenseId}`);
}

export function createSoftwareLicense(payload: SoftwareLicensePayload) {
  return apiRequest<SoftwareLicenseDetail>("/software-licenses", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateSoftwareLicense(licenseId: number, payload: SoftwareLicensePayload) {
  return apiRequest<SoftwareLicenseDetail>(`/software-licenses/${licenseId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function assignSoftwareLicense(licenseId: number, payload: SoftwareLicenseAssignPayload) {
  return apiRequest<SoftwareLicenseAssignment>(`/software-licenses/${licenseId}/assign`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function revokeSoftwareLicenseAssignment(assignmentId: number, payload: SoftwareLicenseRevokePayload) {
  return apiRequest<SoftwareLicenseAssignment>(`/software-licenses/assignments/${assignmentId}/revoke`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
