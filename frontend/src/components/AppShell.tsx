import { NavLink, Outlet, useNavigate } from "react-router-dom";

import { clearAccessToken } from "../lib/session";
import { useCurrentUser } from "../hooks/useCurrentUser";

const baseNavItems = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/assets", label: "Asset" },
  { to: "/maintenance-tickets", label: "Manutenzione" },
  { to: "/lookups", label: "Tabelle" },
];

export function AppShell() {
  const navigate = useNavigate();
  const { data: currentUser } = useCurrentUser();
  const isAdmin = currentUser?.role_codes.includes("ADMIN") ?? false;
  const navItems = isAdmin ? [...baseNavItems, { to: "/users", label: "Utenti" }] : baseNavItems;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="grid min-h-screen grid-cols-[240px_1fr]">
        <aside className="border-r border-slate-200 bg-white p-6">
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">Aziendale</p>
            <h1 className="mt-2 text-2xl font-semibold">Asset Manager</h1>
          </div>
          <nav className="space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  [
                    "block rounded-md px-3 py-2 text-sm font-medium",
                    isActive ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-slate-100",
                  ].join(" ")
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="mt-8 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
            <p className="font-medium text-slate-900">{currentUser?.full_name ?? "Sessione attiva"}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.15em]">{currentUser?.role_codes.join(", ") ?? ""}</p>
            <button
              className="mt-3 text-sm font-medium text-brand-700"
              onClick={() => {
                clearAccessToken();
                navigate("/login");
              }}
            >
              Esci
            </button>
          </div>
        </aside>
        <main className="p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
