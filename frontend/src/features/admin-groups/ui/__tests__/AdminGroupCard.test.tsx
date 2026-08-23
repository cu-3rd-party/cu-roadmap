import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import type {
  DisciplineGroup,
  DisciplineGroupNode,
} from "@/entities/disciplineGroup";
import { renderWithQuery } from "@/test/renderWithQuery";

import { AdminGroupCard } from "../AdminGroupCard";

const child = (title: string): DisciplineGroupNode => ({
  type: "course",
  logicalOp: null,
  minCount: 0,
  maxCount: null,
  courseId: null,
  title,
  children: [],
});

const group = (
  expression: Partial<DisciplineGroupNode> = {},
): DisciplineGroup => ({
  id: "8e26a091-0000-4000-8000-000000000001",
  title: "Коробка математики",
  category: "prerequisite",
  rootBoxId: "8e26a091-0000-4000-8000-0000000000b1",
  expression: {
    type: "logical",
    logicalOp: "or",
    minCount: 1,
    maxCount: null,
    courseId: null,
    title: "",
    children: [child("Анализ"), child("Алгебра")],
    ...expression,
  },
});

/* The card next to the route it links to, so "clicking navigates" is asserted
   against the router rather than against an href string. */
const renderCard = (value = group(), onDelete = vi.fn()) => {
  renderWithQuery(
    <Routes>
      <Route
        path="/admin/boxes"
        element={<AdminGroupCard group={value} onDelete={onDelete} />}
      />
      <Route path="/admin/boxes/:groupId" element={<p>редактор</p>} />
    </Routes>,
    { route: "/admin/boxes" },
  );

  return onDelete;
};

describe("AdminGroupCard", () => {
  it("renders the title, the object count and the choice rule", () => {
    renderCard();

    expect(screen.getByText("Коробка математики")).toBeInTheDocument();
    expect(screen.getByText("2 объекта")).toBeInTheDocument();
    expect(screen.getByText("1 из 2")).toBeInTheDocument();
  });

  it('labels an "and" group as Логика instead of a count', () => {
    renderCard(group({ logicalOp: "and" }));

    expect(screen.getByText("Логика")).toBeInTheDocument();
    expect(screen.queryByText("1 из 2")).not.toBeInTheDocument();
  });

  it("shows only the count badge for an empty box", () => {
    renderCard(group({ children: [] }));

    expect(screen.getByText("0 объектов")).toBeInTheDocument();
    expect(screen.queryByText(/из/)).not.toBeInTheDocument();
  });

  it("opens the box editor when the card body is clicked", async () => {
    renderCard();

    await userEvent.click(screen.getByText("Коробка математики"));

    expect(await screen.findByText("редактор")).toBeInTheDocument();
  });

  it("asks to delete without navigating when Удалить is clicked", async () => {
    const value = group();
    const onDelete = renderCard(value);

    await userEvent.click(screen.getByRole("button", { name: /Удалить/ }));

    expect(onDelete).toHaveBeenCalledWith(value);
    expect(screen.queryByText("редактор")).not.toBeInTheDocument();
  });
});
