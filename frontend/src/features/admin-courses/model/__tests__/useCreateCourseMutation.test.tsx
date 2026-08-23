import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createCourse } from "@/entities/course";
import { renderWithQuery } from "@/test/renderWithQuery";

import {
  NEW_COURSE,
  useCreateCourseMutation,
} from "../useCreateCourseMutation";

vi.mock("@/entities/course", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/course")>()),
  createCourse: vi.fn(),
}));

const mockedCreate = vi.mocked(createCourse);

const NEW_ID = "8e26a091-0000-4000-8000-00000000abcd";

// A bare button standing in for "Добавить курс", next to the editor route it is
// supposed to land on — so the assertion is against the router, not a URL string.
const AddButton = () => {
  const { mutate } = useCreateCourseMutation();
  return (
    <button type="button" onClick={() => mutate()}>
      Добавить курс
    </button>
  );
};

const renderFlow = () =>
  renderWithQuery(
    <Routes>
      <Route path="/admin/courses" element={<AddButton />} />
      <Route path="/admin/courses/:courseId" element={<p>редактор</p>} />
    </Routes>,
    { route: "/admin/courses" },
  );

describe("useCreateCourseMutation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates the stub course and opens its editor", async () => {
    mockedCreate.mockResolvedValue(NEW_ID);
    renderFlow();

    await userEvent.click(screen.getByRole("button"));

    expect(mockedCreate).toHaveBeenCalledWith(NEW_COURSE);
    expect(await screen.findByText("редактор")).toBeInTheDocument();
  });

  it("stays put when the request fails", async () => {
    mockedCreate.mockRejectedValue(new Error("нет связи"));
    renderFlow();

    await userEvent.click(screen.getByRole("button"));

    await waitFor(() => expect(mockedCreate).toHaveBeenCalled());
    expect(screen.queryByText("редактор")).not.toBeInTheDocument();
  });
});

describe("NEW_COURSE", () => {
  it("carries a category the admin filter can label", () => {
    expect(NEW_COURSE.title).toBe("Новый курс");
    expect(NEW_COURSE.category).toBe("fundamentals");
    expect(NEW_COURSE.allowed_cohorts).toEqual([2026]);
  });
});
