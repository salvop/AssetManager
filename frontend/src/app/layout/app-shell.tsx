import { useNavigate } from "react-router-dom";

import {
  AppShell as AppShellLayout,
  type AppShellSummary,
  type AppShellUser,
} from "@/components/layout/app-shell";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { useDashboardSummary } from "@/features/dashboard/hooks/useDashboardSummary";
import { clearAccessToken } from "@/lib/session";

export function AppShell() {
  const navigate = useNavigate();
  const { data: currentUser } = useCurrentUser();
  const { data: dashboardSummary } = useDashboardSummary();

  const shellUser: AppShellUser | undefined = currentUser
    ? {
        fullName: currentUser.full_name,
        roleCodes: currentUser.role_codes,
      }
    : undefined;

  const shellSummary: AppShellSummary | undefined = dashboardSummary
    ? {
        totalNotifications: dashboardSummary.total_notifications,
        openMaintenanceTickets: dashboardSummary.open_maintenance_tickets,
        assignmentsDueSoon: dashboardSummary.assignments_due_soon,
        overdueAssignments: dashboardSummary.overdue_assignments,
      }
    : undefined;

  return (
    <AppShellLayout
      currentUser={shellUser}
      dashboardSummary={shellSummary}
      onLogout={() => {
        clearAccessToken();
        navigate("/login");
      }}
    />
  );
}
