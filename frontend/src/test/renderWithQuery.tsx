import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";

/* Anything touching the auth hooks needs a QueryClientProvider. Retries off so a
   rejected queryFn surfaces immediately instead of after backoff. */
export const renderWithQuery = (
  ui: ReactNode,
  { route = "/" }: { route?: string } = {},
) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
};
