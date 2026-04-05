import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { AssetFormPage } from "./AssetFormPage";
import { renderWithProviders } from "@/test/utils";

vi.mock("@/features/lookups/hooks/useLookups", () => ({
  useLookupsBundle: () => ({
    categories: [{ id: 1, name: "Laptop", code: "LAPTOP" }],
    statuses: [{ id: 1, name: "In Stock", code: "IN_STOCK" }],
    models: [],
    locations: [],
    vendors: [],
    departments: [],
    isLoading: false,
    error: null,
  }),
}));

vi.mock("@/features/assets/hooks/useAssets", () => ({
  useAsset: () => ({
    data: null,
    isLoading: false,
  }),
}));

describe("AssetFormPage", () => {
  it("shows validation errors when submitting an empty form", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AssetFormPage />, { route: "/assets/new" });

    await user.click(screen.getByRole("button", { name: "Crea asset" }));

    expect(screen.getByText("Il nome e obbligatorio")).toBeInTheDocument();
    expect(screen.getByText("La categoria e obbligatoria")).toBeInTheDocument();
    expect(screen.getByText("Lo stato e obbligatorio")).toBeInTheDocument();
  });
});
