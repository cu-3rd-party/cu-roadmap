import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import type { Course } from "@/entities/course";
import { renderWithQuery } from "@/test/renderWithQuery";

import { AdminCourseCard } from "../AdminCourseCard";

const course: Course = {
  id: "8e26a091-0000-4000-8000-000000000001",
  title: "Основы математического анализа и линейной алгебры 2",
  type: "core",
  category: "swe",
  handbookLink: "",
  availableSemesters: [1],
  allowedCohorts: [2025],
  workload: 5,
};

/* The card next to the route it links to, so "clicking navigates" is asserted
   against the router rather than against an href string. */
const renderCard = (onDelete = vi.fn()) => {
  renderWithQuery(
    <Routes>
      <Route
        path="/admin/courses"
        element={<AdminCourseCard course={course} onDelete={onDelete} />}
      />
      <Route path="/admin/courses/:courseId" element={<p>редактор</p>} />
    </Routes>,
    { route: "/admin/courses" },
  );

  return onDelete;
};

describe("AdminCourseCard", () => {
  it("renders the title and both filter badges", () => {
    renderCard();

    expect(screen.getByText(course.title)).toBeInTheDocument();
    expect(screen.getByText("2025")).toBeInTheDocument();
    expect(screen.getByText("Разработка")).toBeInTheDocument();
  });

  it("opens the course editor when the card body is clicked", async () => {
    renderCard();

    await userEvent.click(screen.getByText(course.title));

    expect(await screen.findByText("редактор")).toBeInTheDocument();
  });

  it("asks to delete without navigating when Удалить is clicked", async () => {
    const onDelete = renderCard();

    await userEvent.click(screen.getByRole("button", { name: /Удалить/ }));

    expect(onDelete).toHaveBeenCalledWith(course);
    expect(screen.queryByText("редактор")).not.toBeInTheDocument();
  });
});
