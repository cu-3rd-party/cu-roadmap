import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { Course } from "../../model/types";
import { CourseSelectCard } from "../CourseSelectCard";

const course = (over: Partial<Course> = {}): Course => ({
  id: "c1",
  title: "Линейная алгебра",
  type: "core",
  category: "ai",
  handbookLink: "",
  availableSemesters: [1],
  workload: 4,
  ...over,
});

/* Guards the planner's card DOM through the SelectTile extraction — the modal
   itself has no component test. */
describe("CourseSelectCard", () => {
  it("reflects selection through aria-pressed", () => {
    const { rerender } = render(
      <CourseSelectCard
        course={course()}
        selected={false}
        disabled={false}
        onSelect={vi.fn()}
      />,
    );
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "false");

    rerender(
      <CourseSelectCard
        course={course()}
        selected
        disabled={false}
        onSelect={vi.fn()}
      />,
    );
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "true");
  });

  it("shows the semester counter only when the course is placed", () => {
    const { rerender } = render(
      <CourseSelectCard
        course={course()}
        selected
        selectedSemester={3}
        disabled={false}
        onSelect={vi.fn()}
      />,
    );
    expect(screen.getByText("3")).toBeInTheDocument();

    rerender(
      <CourseSelectCard
        course={course()}
        selected={false}
        disabled={false}
        onSelect={vi.fn()}
      />,
    );
    expect(screen.queryByText("3")).not.toBeInTheDocument();
  });

  it("passes the course and its semester to onSelect", async () => {
    const onSelect = vi.fn();
    render(
      <CourseSelectCard
        course={course()}
        selected
        selectedSemester={2}
        disabled={false}
        onSelect={onSelect}
      />,
    );

    await userEvent.click(screen.getByRole("button"));
    expect(onSelect).toHaveBeenCalledWith(course(), 2);
  });

  it("does not fire onSelect while disabled", async () => {
    const onSelect = vi.fn();
    render(
      <CourseSelectCard
        course={course()}
        selected={false}
        disabled
        onSelect={onSelect}
      />,
    );

    await userEvent.click(screen.getByRole("button"));
    expect(onSelect).not.toHaveBeenCalled();
  });
});
