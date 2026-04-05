import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { renderWithProviders } from "@/test/utils";

import { LoginPage } from "./login-page";

describe("LoginPage", () => {
  it("renders login form", () => {
    renderWithProviders(<LoginPage />, { route: "/login" });

    expect(screen.getByRole("heading", { name: "OpsAsset" })).toBeInTheDocument();
    expect(screen.getByLabelText("Nome utente")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Accedi" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mostra password" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Problemi di accesso?" })).toHaveAttribute(
      "href",
      "mailto:support@fidesspa.eu",
    );
  });

  it("shows validation messages when submitting empty form", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />, { route: "/login" });

    await user.click(screen.getByRole("button", { name: "Accedi" }));

    expect(screen.getByText("Il nome utente e obbligatorio")).toBeInTheDocument();
    expect(screen.getByText("La password e obbligatoria")).toBeInTheDocument();
  });

  it("toggles password visibility", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />, { route: "/login" });

    const passwordInput = screen.getByLabelText("Password");
    const toggleButton = screen.getByRole("button", { name: "Mostra password" });

    expect(passwordInput).toHaveAttribute("type", "password");

    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute("type", "text");
    expect(screen.getByRole("button", { name: "Nascondi password" })).toBeInTheDocument();
  });

  it("shows Caps Lock warning while typing password", () => {
    renderWithProviders(<LoginPage />, { route: "/login" });

    const passwordInput = screen.getByLabelText("Password");
    fireEvent.keyDown(passwordInput, { key: "CapsLock" });

    expect(screen.getByText("Caps Lock attivo.")).toBeInTheDocument();
  });

  it("uses support email from login preference when available", () => {
    window.localStorage.setItem("opsasset.login.supportEmail", "custom-support@example.com");
    renderWithProviders(<LoginPage />, { route: "/login" });

    expect(screen.getByRole("link", { name: "Problemi di accesso?" })).toHaveAttribute(
      "href",
      "mailto:custom-support@example.com",
    );

    window.localStorage.removeItem("opsasset.login.supportEmail");
  });
});
