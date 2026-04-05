import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AssetDetailPage } from "./AssetDetailPage";
import { renderWithProviders } from "../../../test/utils";

vi.mock("../hooks/useAssets", () => ({
  useAsset: () => ({
    isLoading: false,
    error: null,
    data: {
      id: 1,
      asset_tag: "LT-1001",
      name: "ThinkPad T14",
      serial_number: "SER-001",
      asset_type: "Notebook",
      brand: "Lenovo",
      description: "Laptop operativo",
      purchase_date: null,
      warranty_expiry_date: null,
      expected_end_of_life_date: null,
      disposal_date: null,
      cost_center: null,
      location_floor: null,
      location_room: null,
      location_rack: null,
      location_slot: null,
      category: { id: 1, name: "Laptop", code: "LAPTOP" },
      model: null,
      status: { id: 1, name: "In Stock", code: "IN_STOCK" },
      location: { id: 1, name: "Headquarters", code: "HQ" },
      vendor: null,
      current_department: null,
      assigned_employee: null,
      assignments: [],
      events: [],
      documents: [],
      photo_document: null,
    },
  }),
}));

vi.mock("../hooks/useAssetMaintenance", () => ({
  useAssetMaintenance: () => ({
    data: { items: [], total: 0, page: 1, page_size: 20 },
  }),
}));

vi.mock("../../../hooks/useLookups", () => ({
  useLookupsBundle: () => ({
    employees: [],
    statuses: [{ id: 1, name: "In Stock", code: "IN_STOCK" }],
    locations: [{ id: 1, name: "Headquarters", code: "HQ" }],
    departments: [],
    isLoading: false,
  }),
}));

describe("AssetDetailPage", () => {
  it("renders asset details page", () => {
    renderWithProviders(<AssetDetailPage />, { route: "/assets/1" });

    expect(screen.getByRole("heading", { name: "ThinkPad T14" })).toBeInTheDocument();
    expect(screen.getByText("Dettaglio asset")).toBeInTheDocument();
    expect(screen.getByText("Nessun evento registrato.")).toBeInTheDocument();
  });
});
