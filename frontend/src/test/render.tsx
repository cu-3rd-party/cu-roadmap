import { render } from "@testing-library/react";

import { ThemeProvider } from "@/app/providers";

export function renderWithProviders(ui: React.ReactNode) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}
