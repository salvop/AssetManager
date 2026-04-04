import { Navigate, Route, Routes } from "react-router-dom";

import { AppShell } from "../components/AppShell";
import { getAccessToken } from "../lib/session";
import { AssignmentHistoryPage } from "../pages/AssignmentHistoryPage";
import { AssetDetailPage } from "../pages/AssetDetailPage";
import { AssetFormPage } from "../pages/AssetFormPage";
import { DashboardPage } from "../pages/DashboardPage";
import { AssetListPage } from "../pages/AssetListPage";
import { LoginPage } from "../pages/LoginPage";
import { LookupManagementPage } from "../pages/LookupManagementPage";
import { MaintenanceTicketDetailPage } from "../pages/MaintenanceTicketDetailPage";
import { MaintenanceTicketListPage } from "../pages/MaintenanceTicketListPage";
import { UserManagementPage } from "../pages/UserManagementPage";

function ProtectedShell() {
  if (!getAccessToken()) {
    return <Navigate to="/login" replace />;
  }

  return <AppShell />;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedShell />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/assets" element={<AssetListPage />} />
        <Route path="/assets/new" element={<AssetFormPage />} />
        <Route path="/assets/:assetId" element={<AssetDetailPage />} />
        <Route path="/assets/:assetId/edit" element={<AssetFormPage />} />
        <Route path="/assets/:assetId/assignments" element={<AssignmentHistoryPage />} />
        <Route path="/maintenance-tickets" element={<MaintenanceTicketListPage />} />
        <Route path="/maintenance-tickets/:ticketId" element={<MaintenanceTicketDetailPage />} />
        <Route path="/lookups" element={<LookupManagementPage />} />
        <Route path="/users" element={<UserManagementPage />} />
      </Route>
    </Routes>
  );
}
