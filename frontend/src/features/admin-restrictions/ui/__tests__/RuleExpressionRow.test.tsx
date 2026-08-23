import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";

import type { ComparisonOperator, RuleTerm } from "../../model";
import { RuleExpressionRow } from "../RuleExpressionRow";

// The row is controlled, so drive it through a tiny stateful host — that is how
// the rule card uses it.
const Harness = () => {
  const [terms, setTerms] = useState<RuleTerm[]>([
    { id: "seed", groupId: "major-core" },
  ]);
  const [operator, setOperator] = useState<ComparisonOperator>("eq");
  const [count, setCount] = useState(3);

  return (
    <RuleExpressionRow
      terms={terms}
      operator={operator}
      count={count}
      onTermsChange={setTerms}
      onOperatorChange={setOperator}
      onCountChange={setCount}
    />
  );
};

// Category triggers are comboboxes; the operator one is named, so exclude it.
const categoryTriggers = () =>
  screen
    .getAllByRole("combobox")
    .filter((el) => el.getAttribute("aria-label") !== "Знак сравнения");

describe("RuleExpressionRow", () => {
  it("starts with a single category and no way to remove it", () => {
    render(<Harness />);

    expect(categoryTriggers()).toHaveLength(1);
    expect(
      screen.getByRole("button", { name: "Убрать категорию" }),
    ).toBeDisabled();
  });

  it("adds a category and its join badge when plus is pressed", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(
      screen.getByRole("button", { name: "Добавить категорию" }),
    );

    expect(categoryTriggers()).toHaveLength(2);
    expect(screen.getAllByText("+")).toHaveLength(1);
    expect(
      screen.getByRole("button", { name: "Убрать категорию" }),
    ).toBeEnabled();
  });

  it("drops the right-most category and its join badge when minus is pressed", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(
      screen.getByRole("button", { name: "Добавить категорию" }),
    );
    await user.click(screen.getByRole("button", { name: "Убрать категорию" }));

    expect(categoryTriggers()).toHaveLength(1);
    expect(screen.queryByText("+")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Убрать категорию" }),
    ).toBeDisabled();
  });

  it("clamps the course count on blur", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const count = screen.getByLabelText("Количество курсов");
    await user.clear(count);
    await user.type(count, "-4");
    await user.tab();

    expect(count).toHaveValue(0);
  });
});
