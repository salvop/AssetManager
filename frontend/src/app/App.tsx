import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { AppRoutes } from "../routes/AppRoutes";
import { onSessionExpired } from "../lib/session";

export function App() {
  const navigate = useNavigate();

  useEffect(() => {
    return onSessionExpired(() => {
      navigate("/login", { replace: true });
    });
  }, [navigate]);

  return <AppRoutes />;
}
