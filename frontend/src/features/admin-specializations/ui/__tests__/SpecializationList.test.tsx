import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import type { StructureSpecialization } from "@/entities/major";

import { SpecializationList } from "../SpecializationList";

const SPECIALIZATIONS: StructureSpecialization[] = [
  { id: "system-development", title: "Системная разработка" },
  { id: "data-engineering", title: "Инженерия данных" },
];

// Rows link to the restrictions editor, so they need a router around them.
const renderList = (ui: React.ReactNode) =>
  render(<MemoryRouter>{ui}</MemoryRouter>);

describe("SpecializationList", () => {
  it("renders a row per specialization, linked to its restrictions page", () => {
    renderList(<SpecializationList specializations={SPECIALIZATIONS} />);

    for (const { title } of SPECIALIZATIONS) {
      expect(screen.getByText(title)).toBeInTheDocument();
    }
    expect(
      screen.getByRole("link", { name: /Системная разработка/ }),
    ).toHaveAttribute(
      "href",
      "/admin/specializations/system-development/restrictions",
    );
  });

  // Delete has no backend endpoint yet, so the page passes no onDelete.
  it("hides the delete button when no handler is given", () => {
    renderList(<SpecializationList specializations={SPECIALIZATIONS} />);

    expect(
      screen.queryByRole("button", { name: "Удалить" }),
    ).not.toBeInTheDocument();
  });

  it("renders the empty state when there is nothing to show", () => {
    renderList(<SpecializationList specializations={[]} />);

    expect(screen.getByText("Специализаций пока нет.")).toBeInTheDocument();
  });

  it("renders skeletons instead of the empty state while loading", () => {
    renderList(<SpecializationList isLoading />);

    expect(
      screen.queryByText("Специализаций пока нет."),
    ).not.toBeInTheDocument();
  });

  it("renders the error message when the query failed", () => {
    renderList(<SpecializationList error={new Error("boom")} />);

    expect(
      screen.queryByText("Специализаций пока нет."),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/Не удалось|Ошибка|ошибка/)).toBeInTheDocument();
  });
});
