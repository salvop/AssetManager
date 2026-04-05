import React from "react";
import ReactDOM from "react-dom/client";

import { App } from "./app/App";
import { AppQueryProvider } from "./app/providers/query-provider";
import { AppRouterProvider } from "./app/providers/router-provider";
import "./app/styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppQueryProvider>
      <AppRouterProvider>
        <App />
      </AppRouterProvider>
    </AppQueryProvider>
  </React.StrictMode>,
);
