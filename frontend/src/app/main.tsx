import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import "./styles/index.css";
import { QueryProvider, ThemeProvider } from "@/app/providers";

import { enableMocking } from "./mocks/browser";
import { AppRouter } from "./router";

enableMocking().then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <QueryProvider>
        <ThemeProvider>
          <BrowserRouter>
            <AppRouter />
          </BrowserRouter>
        </ThemeProvider>
      </QueryProvider>
    </StrictMode>,
  );
});
