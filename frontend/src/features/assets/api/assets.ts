import { apiDownload, apiRequest } from "@/api/http";
import type {
  AssetAssignPayload,
  AssetAssignment,
  AssetDetail,
  AssetDocument,
  AssetListResponse,
  AssetLocationChangePayload,
  AssetPayload,
  AssetReturnPayload,
  AssetStatusChangePayload,
} from "@/types/api";

type AssetListParams = {
  search?: string;
  statusId?: number;
  categoryId?: number;
  modelId?: number;
  locationId?: number;
  departmentId?: number;
  assignedEmployeeId?: number;
  vendorId?: number;
  page?: number;
  pageSize?: number;
};

export function getAssets(params: AssetListParams = {}): Promise<AssetListResponse> {
  const searchParams = new URLSearchParams();
  if (params.search) searchParams.set("search", params.search);
  if (params.statusId) searchParams.set("status_id", String(params.statusId));
  if (params.categoryId) searchParams.set("category_id", String(params.categoryId));
  if (params.modelId) searchParams.set("model_id", String(params.modelId));
  if (params.locationId) searchParams.set("location_id", String(params.locationId));
  if (params.departmentId) searchParams.set("department_id", String(params.departmentId));
  if (params.assignedEmployeeId) searchParams.set("assigned_employee_id", String(params.assignedEmployeeId));
  if (params.vendorId) searchParams.set("vendor_id", String(params.vendorId));
  searchParams.set("page", String(params.page ?? 1));
  searchParams.set("page_size", String(params.pageSize ?? 20));
  return apiRequest<AssetListResponse>(`/assets?${searchParams.toString()}`);
}

export function getAsset(assetId: number) {
  return apiRequest<AssetDetail>(`/assets/${assetId}`);
}

export function createAsset(payload: AssetPayload) {
  return apiRequest<AssetDetail>("/assets", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateAsset(assetId: number, payload: AssetPayload) {
  return apiRequest<AssetDetail>(`/assets/${assetId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function changeAssetStatus(assetId: number, payload: AssetStatusChangePayload) {
  return apiRequest<AssetDetail>(`/assets/${assetId}/status`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function changeAssetLocation(assetId: number, payload: AssetLocationChangePayload) {
  return apiRequest<AssetDetail>(`/assets/${assetId}/location`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function assignAsset(assetId: number, payload: AssetAssignPayload) {
  return apiRequest<AssetAssignment>(`/assets/${assetId}/assign`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function returnAsset(assetId: number, payload: AssetReturnPayload) {
  return apiRequest<AssetAssignment>(`/assets/${assetId}/return`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function uploadAssetDocument(assetId: number, file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return apiRequest<AssetDocument>(`/assets/${assetId}/documents`, {
    method: "POST",
    body: formData,
  });
}

export function deleteDocument(documentId: number) {
  return apiRequest<void>(`/documents/${documentId}`, {
    method: "DELETE",
  });
}

export async function downloadDocument(documentId: number) {
  const { blob, filename } = await apiDownload(`/documents/${documentId}/download`);
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename ?? `document-${documentId}`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
}

export function fetchDocumentBlob(documentId: number) {
  return apiDownload(`/documents/${documentId}/download`);
}

export async function exportAssetsCsv(params: AssetListParams = {}) {
  const searchParams = new URLSearchParams();
  if (params.search) searchParams.set("search", params.search);
  if (params.statusId) searchParams.set("status_id", String(params.statusId));
  if (params.categoryId) searchParams.set("category_id", String(params.categoryId));
  if (params.modelId) searchParams.set("model_id", String(params.modelId));
  if (params.locationId) searchParams.set("location_id", String(params.locationId));
  if (params.departmentId) searchParams.set("department_id", String(params.departmentId));
  if (params.assignedEmployeeId) searchParams.set("assigned_employee_id", String(params.assignedEmployeeId));
  if (params.vendorId) searchParams.set("vendor_id", String(params.vendorId));
  const query = searchParams.toString();
  const { blob, filename } = await apiDownload(`/assets/export/csv${query ? `?${query}` : ""}`);
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename ?? "asset-inventory-export.csv";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
}

export async function exportAssetsXlsx(params: AssetListParams = {}) {
  const searchParams = new URLSearchParams();
  if (params.search) searchParams.set("search", params.search);
  if (params.statusId) searchParams.set("status_id", String(params.statusId));
  if (params.categoryId) searchParams.set("category_id", String(params.categoryId));
  if (params.modelId) searchParams.set("model_id", String(params.modelId));
  if (params.locationId) searchParams.set("location_id", String(params.locationId));
  if (params.departmentId) searchParams.set("department_id", String(params.departmentId));
  if (params.assignedEmployeeId) searchParams.set("assigned_employee_id", String(params.assignedEmployeeId));
  if (params.vendorId) searchParams.set("vendor_id", String(params.vendorId));
  const query = searchParams.toString();
  const { blob, filename } = await apiDownload(`/assets/export/xlsx${query ? `?${query}` : ""}`);
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename ?? "asset-inventory-export.xlsx";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
}
