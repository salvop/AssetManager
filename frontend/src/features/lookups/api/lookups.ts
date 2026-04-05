import { apiRequest } from "@/api/http";
import type {
  AssetModelCreatePayload,
  AssetModelUpdatePayload,
  LookupCreatePayload,
  LookupListResponse,
  LookupReference,
  LookupUpdatePayload,
  VendorCreatePayload,
  VendorUpdatePayload,
} from "@/types/api";

export function getDepartments() {
  return apiRequest<LookupListResponse>("/departments");
}

export function getLocations() {
  return apiRequest<LookupListResponse>("/locations");
}

export function getVendors() {
  return apiRequest<LookupListResponse>("/vendors");
}

export function getAssetCategories() {
  return apiRequest<LookupListResponse>("/asset-categories");
}

export function getAssetStatuses() {
  return apiRequest<LookupListResponse>("/asset-statuses");
}

export function getAssetModels() {
  return apiRequest<LookupListResponse>("/asset-models");
}

export function createDepartment(payload: LookupCreatePayload) {
  return apiRequest<LookupReference>("/departments", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateDepartment(id: number, payload: LookupUpdatePayload) {
  return apiRequest<LookupReference>(`/departments/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteDepartment(id: number) {
  return apiRequest<void>(`/departments/${id}`, {
    method: "DELETE",
  });
}

export function createLocation(payload: LookupCreatePayload) {
  return apiRequest<LookupReference>("/locations", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateLocation(id: number, payload: LookupUpdatePayload) {
  return apiRequest<LookupReference>(`/locations/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteLocation(id: number) {
  return apiRequest<void>(`/locations/${id}`, {
    method: "DELETE",
  });
}

export function createVendor(payload: VendorCreatePayload) {
  return apiRequest<LookupReference>("/vendors", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateVendor(id: number, payload: VendorUpdatePayload) {
  return apiRequest<LookupReference>(`/vendors/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteVendor(id: number) {
  return apiRequest<void>(`/vendors/${id}`, {
    method: "DELETE",
  });
}

export function createAssetCategory(payload: LookupCreatePayload) {
  return apiRequest<LookupReference>("/asset-categories", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateAssetCategory(id: number, payload: LookupUpdatePayload) {
  return apiRequest<LookupReference>(`/asset-categories/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteAssetCategory(id: number) {
  return apiRequest<void>(`/asset-categories/${id}`, {
    method: "DELETE",
  });
}

export function createAssetModel(payload: AssetModelCreatePayload) {
  return apiRequest<LookupReference>("/asset-models", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateAssetModel(id: number, payload: AssetModelUpdatePayload) {
  return apiRequest<LookupReference>(`/asset-models/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteAssetModel(id: number) {
  return apiRequest<void>(`/asset-models/${id}`, {
    method: "DELETE",
  });
}
