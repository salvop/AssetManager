import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { renderWithProviders } from "@/test/utils";

import { LoginPage } from "./login-page";

describe("LoginPage", () => {
  it("renders login form", () => {
    renderWithProviders(<LoginPage />, { route: "/login" });

    expect(screen.getByRole("heading", { name: "Workspace asset" })).toBeInTheDocument();
    expect(screen.getByLabelText("Username")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Accedi" })).toBeInTheDocument();
  });

  it("shows validation messages when submitting empty form", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />, { route: "/login" });

    await user.click(screen.getByRole("button", { name: "Accedi" }));

    expect(screen.getByText("Lo username e obbligatorio")).toBeInTheDocument();
    expect(screen.getByText("La password e obbligatoria")).toBeInTheDocument();
  });
});
