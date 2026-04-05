import { apiRequest } from "@/api/http";
import type {
  AssetRequest,
  AssetRequestApprovePayload,
  AssetRequestCreatePayload,
  AssetRequestListResponse,
} from "@/types/api";

type AssetRequestListParams = {
  page?: number;
  pageSize?: number;
};

export function getAssetRequests(params: AssetRequestListParams = {}): Promise<AssetRequestListResponse> {
  const searchParams = new URLSearchParams();
  searchParams.set("page", String(params.page ?? 1));
  searchParams.set("page_size", String(params.pageSize ?? 20));
  return apiRequest<AssetRequestListResponse>(`/asset-requests?${searchParams.toString()}`);
}

export function createAssetRequest(payload: AssetRequestCreatePayload): Promise<AssetRequest> {
  return apiRequest<AssetRequest>("/asset-requests", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function approveAssetRequest(requestId: number, payload: AssetRequestApprovePayload): Promise<AssetRequest> {
  return apiRequest<AssetRequest>(`/asset-requests/${requestId}/approve`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
