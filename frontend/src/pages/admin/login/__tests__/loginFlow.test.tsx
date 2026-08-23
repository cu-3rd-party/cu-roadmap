import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RequireAuth } from "@/features/auth";
import { checkAuth, login } from "@/features/auth/api/auth";
import { renderWithQuery } from "@/test/renderWithQuery";

import LoginPage from "../ui/LoginPage";

vi.mock("@/features/auth/api/auth", () => ({
  login: vi.fn(),
  checkAuth: vi.fn(),
  logout: vi.fn(),
}));

const mockedLogin = vi.mocked(login);
const mockedCheckAuth = vi.mocked(checkAuth);

/* The guarded route and the login screen wired together, entered at the guarded
   route — the path that bounces you to the login screen with a cached "not
   authorized" answer already in the query cache. */
const renderFlow = () =>
  renderWithQuery(
    <Routes>
      <Route element={<RequireAuth />}>
        <Route path="/admin/specializations" element={<p>траектории</p>} />
      </Route>
      <Route path="/admin/login" element={<LoginPage />} />
    </Routes>,
    { route: "/admin/specializations" },
  );

describe("login flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lands on the guarded route after a single password entry", async () => {
    // Logged out on arrival, logged in once the cookie is set.
    mockedCheckAuth.mockResolvedValueOnce(false).mockResolvedValue(true);
    mockedLogin.mockResolvedValue(undefined);
    const user = userEvent.setup();

    renderFlow();

    await user.type(await screen.findByLabelText("Пароль"), "hunter2");
    await user.click(screen.getByRole("button", { name: "Войти" }));

    expect(await screen.findByText("траектории")).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.queryByLabelText("Пароль")).not.toBeInTheDocument(),
    );
  });
});
