import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AssetRequestsPage } from "./AssetRequestsPage";
import { renderWithProviders } from "@/test/utils";

vi.mock("@/features/auth/hooks/useCurrentUser", () => ({
  useCurrentUser: () => ({
    data: {
      id: 1,
      username: "admin",
      full_name: "Admin User",
      email: "admin@example.com",
      is_active: true,
      role_codes: ["ADMIN"],
    },
  }),
}));

vi.mock("@/features/lookups/hooks/useLookups", () => ({
  useLookupsBundle: () => ({
    categories: [{ id: 1, name: "Laptop", code: "LAPTOP" }],
    departments: [{ id: 1, name: "IT", code: "IT" }],
    models: [],
    vendors: [],
    employees: [{ id: 3, employee_code: "EMP-00003", full_name: "Employee User", email: "employee@example.com" }],
    isLoading: false,
    error: null,
  }),
}));

vi.mock("@/features/assets/hooks/useAssetRequests", () => ({
  useAssetRequests: () => ({
    isLoading: false,
    error: null,
    data: {
      items: [
        {
          id: 10,
          requested_by_user: { id: 3, username: "employee", full_name: "Employee User" },
          requested_for_employee: { id: 3, employee_code: "EMP-00003", full_name: "Employee User", email: "employee@example.com" },
          department: { id: 1, name: "IT", code: "IT" },
          category: { id: 1, name: "Laptop", code: "LAPTOP" },
          suggested_model: null,
          suggested_vendor: null,
          priority: "HIGH",
          business_justification: "Nuovo portatile per onboarding",
          status: "PENDING_APPROVAL",
          approved_by_user: null,
          approval_notes: null,
          approved_at: null,
          rejected_at: null,
          created_at: "2026-04-05T10:00:00",
        },
      ],
      total: 1,
      page: 1,
      page_size: 20,
    },
  }),
}));

describe("AssetRequestsPage", () => {
  it("renders asset requests and creation section", () => {
    renderWithProviders(<AssetRequestsPage />, { route: "/asset-requests" });

    expect(screen.getByRole("heading", { name: "Richieste asset" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Stato richieste asset" })).toBeInTheDocument();
    expect(screen.getByText("#10 · Laptop")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Approva" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Crea richiesta" })).toBeInTheDocument();
  });
});
