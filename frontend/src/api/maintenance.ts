import { apiRequest } from "./http";
import type {
  MaintenanceTicket,
  MaintenanceTicketListResponse,
  MaintenanceTicketPayload,
  MaintenanceTicketUpdatePayload,
} from "../types/api";

export function getMaintenanceTickets() {
  return apiRequest<MaintenanceTicketListResponse>("/maintenance-tickets");
}

export function getMaintenanceTicketsByAsset(assetId: number) {
  return apiRequest<MaintenanceTicketListResponse>(`/maintenance-tickets/by-asset/${assetId}`);
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
