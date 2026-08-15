import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { sidebarRoutes } from "@/app/router/routes/sidebar";

import { Sidebar } from "../ui/Sidebar";

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Sidebar />
    </MemoryRouter>,
  );

describe("Sidebar", () => {
  it("renders a link for every sidebar route", () => {
    renderAt("/dashboard");

    for (const { label, path } of sidebarRoutes) {
      expect(screen.getByRole("link", { name: label })).toHaveAttribute(
        "href",
        `/${path}`,
      );
    }
  });

  it("marks only the active route as current", () => {
    renderAt("/courses");

    expect(screen.getByRole("link", { name: "Дисциплины" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Обзор" })).not.toHaveAttribute(
      "aria-current",
    );
  });
});
