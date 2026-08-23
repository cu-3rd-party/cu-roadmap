import { render, screen } from "@testing-library/react";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { SpecializationDetailHeader } from "../SpecializationDetailHeader";

const baseProps = {
  title: "Системная разработка",
  description: "Специализация для настоящих специалистов",
  tab: "restrictions" as const,
  onTabChange: () => {},
  tabsHint: "Подсказка",
};

// jsdom has no matchMedia, and HintButton reads it to pick tooltip vs popover.
// Report desktop so the hint renders as the Tooltip branch.
const originalMatchMedia = window.matchMedia;

beforeAll(() => {
  window.matchMedia = vi.fn(() => ({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })) as unknown as typeof window.matchMedia;
});

afterAll(() => {
  window.matchMedia = originalMatchMedia;
});

describe("SpecializationDetailHeader", () => {
  it("renders the title, description and both tabs", () => {
    render(<SpecializationDetailHeader {...baseProps} />);

    expect(
      screen.getByRole("heading", { name: baseProps.title }),
    ).toBeInTheDocument();
    expect(screen.getByText(baseProps.description)).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Курсы" })).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: "Ограничения" }),
    ).toBeInTheDocument();
  });

  // The backend Specialization has no description, so the real page omits it.
  it("omits the subtitle when no description is given", () => {
    const { description, ...withoutDescription } = baseProps;
    render(<SpecializationDetailHeader {...withoutDescription} />);

    expect(screen.queryByText(description)).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: baseProps.title }),
    ).toBeInTheDocument();
  });

  it("renders the settings and delete actions next to the title", () => {
    render(<SpecializationDetailHeader {...baseProps} />);

    expect(
      screen.getByRole("button", { name: "Настройки специализации" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Удалить специализацию" }),
    ).toBeInTheDocument();
  });

  // The reuse contract with the future "Курсы" screen: no action slot, no
  // "Добавить правило" button.
  it("renders the action slot only when one is passed", () => {
    const { rerender } = render(<SpecializationDetailHeader {...baseProps} />);

    expect(
      screen.queryByRole("button", { name: "Добавить правило" }),
    ).not.toBeInTheDocument();

    rerender(
      <SpecializationDetailHeader
        {...baseProps}
        action={<button type="button">Добавить правило</button>}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Добавить правило" }),
    ).toBeInTheDocument();
  });
});
