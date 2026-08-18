import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiosError, AxiosHeaders } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { login } from "@/features/auth/api/auth";
import { renderWithQuery } from "@/test/renderWithQuery";

import LoginPage from "../ui/LoginPage";

vi.mock("@/features/auth/api/auth", () => ({
  login: vi.fn(),
  checkAuth: vi.fn(),
  logout: vi.fn(),
}));

const mockedLogin = vi.mocked(login);

const httpError = (status: number) =>
  new AxiosError("request failed", "ERR_BAD_REQUEST", undefined, null, {
    status,
    statusText: "",
    data: {},
    headers: {},
    config: { headers: new AxiosHeaders() },
  });

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends the typed password", async () => {
    mockedLogin.mockResolvedValue(undefined);
    const user = userEvent.setup();

    renderWithQuery(<LoginPage />);
    await user.type(screen.getByLabelText("Пароль"), "hunter2");
    await user.click(screen.getByRole("button", { name: "Войти" }));

    // react-query hands mutationFn a context object as a second argument.
    expect(mockedLogin.mock.calls[0]?.[0]).toBe("hunter2");
  });

  it("reports a rejected password rather than the generic 401 copy", async () => {
    mockedLogin.mockRejectedValue(httpError(401));
    const user = userEvent.setup();

    renderWithQuery(<LoginPage />);
    await user.type(screen.getByLabelText("Пароль"), "wrong");
    await user.click(screen.getByRole("button", { name: "Войти" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Неверный пароль",
    );
  });

  it("surfaces the rate limiter instead of blaming the password", async () => {
    mockedLogin.mockRejectedValue(httpError(429));
    const user = userEvent.setup();

    renderWithQuery(<LoginPage />);
    await user.type(screen.getByLabelText("Пароль"), "hunter2");
    await user.click(screen.getByRole("button", { name: "Войти" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Слишком много запросов",
    );
  });

  it("keeps submit disabled until a password is typed", () => {
    renderWithQuery(<LoginPage />);

    expect(screen.getByRole("button", { name: "Войти" })).toBeDisabled();
  });
});
