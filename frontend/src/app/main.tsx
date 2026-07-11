import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import "./styles/index.css";
import { QueryProvider, ThemeProvider } from "@/app/providers";
import { Toaster } from "@/shared/ui/kit";

import { enableMocking } from "./mocks/browser";
import { PwaUpdater } from "./pwa/PwaUpdater";
import { AppRouter } from "./router";

enableMocking().then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <QueryProvider>
        <ThemeProvider>
          <BrowserRouter>
            <AppRouter />
          </BrowserRouter>
          <Toaster />
          <PwaUpdater />
        </ThemeProvider>
      </QueryProvider>
    </StrictMode>,
  );
});
