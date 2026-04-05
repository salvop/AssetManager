import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { renderWithProviders } from "@/test/utils";

import { SoftwareLicenseListPage } from "./software-license-list-page";

const mockUseSoftwareLicenses = vi.fn();

vi.mock("@/features/lookups/hooks/useLookups", () => ({
  useLookupsBundle: () => ({
    vendors: [{ id: 1, name: "Microsoft" }],
  }),
}));

vi.mock("@/features/licenses/hooks/useSoftwareLicenses", () => ({
  useSoftwareLicenses: (params: unknown) => mockUseSoftwareLicenses(params),
}));

describe("SoftwareLicenseListPage", () => {
  beforeEach(() => {
    mockUseSoftwareLicenses.mockReset();
    mockUseSoftwareLicenses.mockImplementation((params?: { page?: number; pageSize?: number; search?: string }) => ({
      isLoading: false,
      error: null,
      data: {
        items: [
          {
            id: 1,
            product_name: "Microsoft 365",
            license_type: "Per User",
            purchased_quantity: 25,
            active_assignments: 12,
            available_quantity: 13,
            expiry_date: "2026-12-31",
            vendor: { id: 1, name: "Microsoft", code: "MSFT" },
          },
        ],
        total: 11,
        page: params?.page ?? 1,
        page_size: params?.pageSize ?? 10,
        summary: {
          total_licenses: 1,
          active_assignments: 12,
          available_quantity: 13,
          expiring_licenses: 1,
        },
      },
    }));
  });

  it("renders software license summary and table", () => {
    renderWithProviders(<SoftwareLicenseListPage />, { route: "/software-licenses" });

    expect(screen.getByRole("heading", { name: "Licenze software" })).toBeInTheDocument();
    expect(screen.getAllByText("1").length).toBeGreaterThan(0);
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("13")).toBeInTheDocument();
    expect(screen.getByText("Microsoft 365")).toBeInTheDocument();
    expect(mockUseSoftwareLicenses).toHaveBeenCalledWith(expect.objectContaining({
      page: 1,
      pageSize: 10,
    }));
  });

  it("updates server-side params when searching", async () => {
    const user = userEvent.setup();
    renderWithProviders(<SoftwareLicenseListPage />, { route: "/software-licenses" });

    await user.type(screen.getByPlaceholderText("Cerca per prodotto o tipo"), "Adobe");

    await waitFor(() => {
      expect(mockUseSoftwareLicenses).toHaveBeenLastCalledWith(expect.objectContaining({
        search: "Adobe",
        page: 1,
        pageSize: 10,
      }));
    });
  });
});
