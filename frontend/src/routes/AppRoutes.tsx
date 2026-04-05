import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { getAccessToken } from "../lib/session";

const AppShell = lazy(() => import("../components/AppShell").then((module) => ({ default: module.AppShell })));
const AppSettingsPage = lazy(() =>
  import("../pages/AppSettingsPage").then((module) => ({ default: module.AppSettingsPage })),
);
const AssignmentHistoryPage = lazy(() =>
  import("../features/assets/pages/AssignmentHistoryPage").then((module) => ({ default: module.AssignmentHistoryPage })),
);
const AssetDetailPage = lazy(() =>
  import("../features/assets/pages/AssetDetailPage").then((module) => ({ default: module.AssetDetailPage })),
);
const AssetFormPage = lazy(() =>
  import("../features/assets/pages/AssetFormPage").then((module) => ({ default: module.AssetFormPage })),
);
const AssetListPage = lazy(() =>
  import("../features/assets/pages/AssetListPage").then((module) => ({ default: module.AssetListPage })),
);
const DashboardPage = lazy(() => import("../pages/DashboardPage").then((module) => ({ default: module.DashboardPage })));
const EmployeeManagementPage = lazy(() =>
  import("../pages/EmployeeManagementPage").then((module) => ({ default: module.EmployeeManagementPage })),
);
const LoginPage = lazy(() => import("../pages/LoginPage").then((module) => ({ default: module.LoginPage })));
const LookupManagementPage = lazy(() =>
  import("../pages/LookupManagementPage").then((module) => ({ default: module.LookupManagementPage })),
);
const MaintenanceTicketDetailPage = lazy(() =>
  import("../pages/MaintenanceTicketDetailPage").then((module) => ({ default: module.MaintenanceTicketDetailPage })),
);
const MaintenanceTicketListPage = lazy(() =>
  import("../pages/MaintenanceTicketListPage").then((module) => ({ default: module.MaintenanceTicketListPage })),
);
const SoftwareLicenseDetailPage = lazy(() =>
  import("../pages/SoftwareLicenseDetailPage").then((module) => ({ default: module.SoftwareLicenseDetailPage })),
);
const SoftwareLicenseListPage = lazy(() =>
  import("../pages/SoftwareLicenseListPage").then((module) => ({ default: module.SoftwareLicenseListPage })),
);
const UserPreferencesPage = lazy(() =>
  import("../pages/UserPreferencesPage").then((module) => ({ default: module.UserPreferencesPage })),
);
const UserManagementPage = lazy(() =>
  import("../pages/UserManagementPage").then((module) => ({ default: module.UserManagementPage })),
);

function ProtectedShell() {
  if (!getAccessToken()) {
    return <Navigate to="/login" replace />;
  }

  return <AppShell />;
}

export function AppRoutes() {
  return (
    <Suspense fallback={<p className="px-6 py-4 text-sm text-slate-500">Caricamento pagina…</p>}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedShell />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/assets" element={<AssetListPage />} />
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
