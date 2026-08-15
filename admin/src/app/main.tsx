import { ThemeProvider } from "@cu/ui/theme";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import "./styles/index.css";
import { QueryProvider } from "@/app/providers";
import { Toaster } from "@/shared/ui";

import { enableMocking } from "./mocks/browser";
import { PwaUpdater } from "./pwa/PwaUpdater";
import { AppRouter } from "./router";

// Served under /admin/ (see vite.config.ts `base`), so the router needs the
// matching basename or every route would resolve one level too high.
enableMocking().then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <QueryProvider>
        <ThemeProvider>
          <BrowserRouter basename="/admin">
            <AppRouter />
          </BrowserRouter>
          <Toaster />
          <PwaUpdater />
        </ThemeProvider>
      </QueryProvider>
    </StrictMode>,
  );
});
