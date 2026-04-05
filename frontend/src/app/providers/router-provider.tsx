import type { ReactNode } from "react";
import { BrowserRouter } from "react-router-dom";

export function AppRouterProvider({ children }: { children: ReactNode }) {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      {children}
    </BrowserRouter>
  );
}
