import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { Skeleton } from "@/components/ui/skeleton";
import { getAccessToken } from "@/lib/session";

const AppShell = lazy(() => import("@/app/layout/app-shell").then((module) => ({ default: module.AppShell })));
const AppSettingsPage = lazy(() =>
  import("@/features/settings/pages/app-settings-page").then((module) => ({ default: module.AppSettingsPage })),
);
const AssignmentHistoryPage = lazy(() =>
  import("@/features/assets/pages/AssignmentHistoryPage").then((module) => ({ default: module.AssignmentHistoryPage })),
);
const AssetDetailPage = lazy(() =>
  import("@/features/assets/pages/AssetDetailPage").then((module) => ({ default: module.AssetDetailPage })),
);
const AssetFormPage = lazy(() =>
  import("@/features/assets/pages/AssetFormPage").then((module) => ({ default: module.AssetFormPage })),
);
const AssetListPage = lazy(() =>
  import("@/features/assets/pages/AssetListPage").then((module) => ({ default: module.AssetListPage })),
);
const AssetRequestsPage = lazy(() =>
  import("@/features/assets/pages/AssetRequestsPage").then((module) => ({ default: module.AssetRequestsPage })),
);
const DashboardPage = lazy(() => import("@/features/dashboard/pages/dashboard-page").then((module) => ({ default: module.DashboardPage })));
const EmployeeManagementPage = lazy(() =>
  import("@/features/employees/pages/employee-management-page").then((module) => ({ default: module.EmployeeManagementPage })),
);
const LoginPage = lazy(() => import("@/features/auth/pages/login-page").then((module) => ({ default: module.LoginPage })));
const LookupManagementPage = lazy(() =>
  import("@/features/lookups/pages/lookup-management-page").then((module) => ({ default: module.LookupManagementPage })),
);
const MaintenanceTicketDetailPage = lazy(() =>
  import("@/features/maintenance/pages/maintenance-ticket-detail-page").then((module) => ({ default: module.MaintenanceTicketDetailPage })),
);
const MaintenanceTicketListPage = lazy(() =>
  import("@/features/maintenance/pages/maintenance-ticket-list-page").then((module) => ({ default: module.MaintenanceTicketListPage })),
);
const SoftwareLicenseDetailPage = lazy(() =>
  import("@/features/licenses/pages/software-license-detail-page").then((module) => ({ default: module.SoftwareLicenseDetailPage })),
);
const SoftwareLicenseListPage = lazy(() =>
  import("@/features/licenses/pages/software-license-list-page").then((module) => ({ default: module.SoftwareLicenseListPage })),
);
const UserPreferencesPage = lazy(() =>
  import("@/features/users/pages/user-preferences-page").then((module) => ({ default: module.UserPreferencesPage })),
);
const UserManagementPage = lazy(() =>
  import("@/features/users/pages/user-management-page").then((module) => ({ default: module.UserManagementPage })),
);

function ProtectedShell() {
  if (!getAccessToken()) {
    return <Navigate to="/login" replace />;
  }

  return <AppShell />;
}

export function AppRoutes() {
  return (
    <Suspense
      fallback={
        <div className="px-6 py-4">
          <div className="flex flex-col gap-3">
            <Skeleton className="h-8 w-48 rounded-xl" />
            <Skeleton className="h-24 rounded-md" />
            <Skeleton className="h-24 rounded-md" />
          </div>
        </div>
      }
    >
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedShell />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/assets" element={<AssetListPage />} />
          <Route path="/asset-requests" element={<AssetRequestsPage />} />
          <Route path="/employees-directory" element={<EmployeeManagementPage />} />
          <Route path="/assets/new" element={<AssetFormPage />} />
          <Route path="/assets/:assetId" element={<AssetDetailPage />} />
          <Route path="/assets/:assetId/edit" element={<AssetFormPage />} />
          <Route path="/assets/:assetId/assignments" element={<AssignmentHistoryPage />} />
          <Route path="/software-licenses" element={<SoftwareLicenseListPage />} />
          <Route path="/software-licenses/:licenseId" element={<SoftwareLicenseDetailPage />} />
          <Route path="/maintenance-tickets" element={<MaintenanceTicketListPage />} />
          <Route path="/maintenance-tickets/:ticketId" element={<MaintenanceTicketDetailPage />} />
          <Route path="/preferences" element={<UserPreferencesPage />} />
          <Route path="/settings" element={<AppSettingsPage />} />
          <Route path="/lookups" element={<LookupManagementPage />} />
          <Route path="/users" element={<UserManagementPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

