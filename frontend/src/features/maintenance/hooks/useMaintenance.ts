import { useQuery } from "@tanstack/react-query";

import { getMaintenanceTicket, getMaintenanceTickets } from "@/features/maintenance/api/maintenance";

export function useMaintenanceTickets() {
  return useQuery({
    queryKey: ["maintenance-tickets"],
    queryFn: () => getMaintenanceTickets(),
  });
}

export function useMaintenanceTicket(ticketId: number) {
  return useQuery({
    queryKey: ["maintenance-ticket", ticketId],
    queryFn: () => getMaintenanceTicket(ticketId),
    enabled: Number.isFinite(ticketId),
  });
}
