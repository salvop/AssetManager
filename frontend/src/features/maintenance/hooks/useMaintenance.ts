import { useQuery } from "@tanstack/react-query";

import { getMaintenanceTicket, getMaintenanceTickets } from "@/features/maintenance/api/maintenance";

type UseMaintenanceTicketsParams = {
  page?: number;
  pageSize?: number;
};

export function useMaintenanceTickets(params: UseMaintenanceTicketsParams = {}) {
  return useQuery({
    queryKey: ["maintenance-tickets", params],
    queryFn: () => getMaintenanceTickets(params),
  });
}

export function useMaintenanceTicket(ticketId: number) {
  return useQuery({
    queryKey: ["maintenance-ticket", ticketId],
    queryFn: () => getMaintenanceTicket(ticketId),
    enabled: Number.isFinite(ticketId),
  });
}
