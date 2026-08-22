import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MOCK_SPECIALIZATIONS } from "../../model";
import { SpecializationList } from "../SpecializationList";

describe("SpecializationList", () => {
  it("renders a row per specialization", () => {
    render(<SpecializationList specializations={MOCK_SPECIALIZATIONS} />);

    for (const { title } of MOCK_SPECIALIZATIONS) {
      expect(screen.getByText(title)).toBeInTheDocument();
    }
    expect(screen.getAllByRole("button", { name: "Удалить" })).toHaveLength(
      MOCK_SPECIALIZATIONS.length,
    );
  });

  it("renders the empty state when there is nothing to show", () => {
    render(<SpecializationList specializations={[]} />);

    expect(screen.getByText("Специализаций пока нет.")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
