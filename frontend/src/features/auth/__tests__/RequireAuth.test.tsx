import { screen, waitFor } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithQuery } from "@/test/renderWithQuery";

import { checkAuth } from "../api/auth";
import { RequireAuth } from "../ui/RequireAuth";

vi.mock("../api/auth", () => ({
  checkAuth: vi.fn(),
}));

const mockedCheckAuth = vi.mocked(checkAuth);

const renderGuarded = () =>
  renderWithQuery(
    <Routes>
      <Route element={<RequireAuth />}>
        <Route path="/secret" element={<p>секретная страница</p>} />
      </Route>
      <Route path="/admin/login" element={<p>экран входа</p>} />
    </Routes>,
    { route: "/secret" },
  );

describe("RequireAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows the loader while the session check is in flight", () => {
    mockedCheckAuth.mockReturnValue(new Promise(() => {}));

    renderGuarded();

    expect(screen.getByText("Загрузка...")).toBeInTheDocument();
    expect(screen.queryByText("секретная страница")).not.toBeInTheDocument();
  });

  it("renders the guarded route once authorized", async () => {
    mockedCheckAuth.mockResolvedValue(true);

    renderGuarded();

    expect(await screen.findByText("секретная страница")).toBeInTheDocument();
  });

  it("redirects to the login screen when not authorized", async () => {
    mockedCheckAuth.mockResolvedValue(false);

    renderGuarded();

    expect(await screen.findByText("экран входа")).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.queryByText("секретная страница")).not.toBeInTheDocument(),
    );
  });
});
