import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AssetListPage } from "./AssetListPage";
import { renderWithProviders } from "../../../test/utils";

vi.mock("../../../hooks/useLookups", () => ({
  useLookupsBundle: () => ({
    statuses: [{ id: 1, name: "In Stock", code: "IN_STOCK" }],
    categories: [{ id: 1, name: "Laptop", code: "LAPTOP" }],
    locations: [{ id: 1, name: "Headquarters", code: "HQ" }],
  }),
}));

vi.mock("../hooks/useAssets", () => ({
  useAssets: () => ({
    isLoading: false,
    error: null,
    data: {
      items: [
        {
          id: 1,
          asset_tag: "LT-1001",
          name: "ThinkPad T14",
          serial_number: "SER-001",
          asset_type: "Notebook",
          brand: "Lenovo",
          status: { id: 1, name: "In Stock", code: "IN_STOCK" },
          category: { id: 1, name: "Laptop", code: "LAPTOP" },
          location: { id: 1, name: "Headquarters", code: "HQ" },
          assigned_employee: null,
          purchase_date: null,
          warranty_expiry_date: null,
          expected_end_of_life_date: null,
          cost_center: null,
          location_floor: null,
          location_room: null,
          location_rack: null,
          location_slot: null,
        },
      ],
      total: 1,
      page: 1,
      page_size: 20,
    },
  }),
}));

describe("AssetListPage", () => {
  it("renders assets table", () => {
    renderWithProviders(<AssetListPage />, { route: "/assets" });

    expect(screen.getByRole("heading", { name: "Registro asset" })).toBeInTheDocument();
    expect(screen.getByText("LT-1001")).toBeInTheDocument();
    expect(screen.getByText("ThinkPad T14")).toBeInTheDocument();
  });
});
