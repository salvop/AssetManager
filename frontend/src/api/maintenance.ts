import { apiRequest } from "./http";
import type {
  MaintenanceTicket,
  MaintenanceTicketListResponse,
  MaintenanceTicketPayload,
  MaintenanceTicketUpdatePayload,
} from "../types/api";

type MaintenanceListParams = {
  page?: number;
  pageSize?: number;
};

export function getMaintenanceTickets(params: MaintenanceListParams = {}) {
  const searchParams = new URLSearchParams();
  searchParams.set("page", String(params.page ?? 1));
  searchParams.set("page_size", String(params.pageSize ?? 100));
  return apiRequest<MaintenanceTicketListResponse>(`/maintenance-tickets?${searchParams.toString()}`);
}

export function getMaintenanceTicketsByAsset(assetId: number, params: MaintenanceListParams = {}) {
  const searchParams = new URLSearchParams();
  searchParams.set("page", String(params.page ?? 1));
  searchParams.set("page_size", String(params.pageSize ?? 100));
  return apiRequest<MaintenanceTicketListResponse>(`/maintenance-tickets/by-asset/${assetId}?${searchParams.toString()}`);
}

export function getMaintenanceTicket(ticketId: number) {
  return apiRequest<MaintenanceTicket>(`/maintenance-tickets/${ticketId}`);
}

export function createMaintenanceTicket(payload: MaintenanceTicketPayload) {
  return apiRequest<MaintenanceTicket>("/maintenance-tickets", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateMaintenanceTicket(ticketId: number, payload: MaintenanceTicketUpdatePayload) {
  return apiRequest<MaintenanceTicket>(`/maintenance-tickets/${ticketId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function changeMaintenanceTicketStatus(ticketId: number, status: string) {
  return apiRequest<MaintenanceTicket>(`/maintenance-tickets/${ticketId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}
