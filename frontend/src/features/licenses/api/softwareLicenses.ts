import { apiRequest } from "@/api/http";
import type {
  SoftwareLicenseAssignPayload,
  SoftwareLicenseAssignment,
  SoftwareLicenseDetail,
  SoftwareLicenseListResponse,
  SoftwareLicensePayload,
  SoftwareLicenseRevokePayload,
} from "@/types/api";

export function getSoftwareLicenses(search?: string) {
  const query = search ? `?search=${encodeURIComponent(search)}` : "";
  return apiRequest<SoftwareLicenseListResponse>(`/software-licenses${query}`);
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
