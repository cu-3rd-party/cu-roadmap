import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ManualPage } from "./index";
import { api } from "@/shared/config";
import { renderWithProviders } from "@/test/render";

vi.mock("@/shared/config", async () => {
  const actual =
    await vi.importActual<typeof import("@/shared/config")>("@/shared/config");

  return {
    ...actual,
    api: {
      ...actual.api,
      getCourses: vi.fn(),
      validateRoadmap: vi.fn(),
    },
  };
});

describe("ManualPage", () => {
  it("adds a course to a semester and validates the roadmap", async () => {
    const user = userEvent.setup();
    const setRoadmap = vi.fn();

    vi.mocked(api.getCourses).mockResolvedValue({
      data: [
        {
          id: "course-1",
          title: "Python Basics",
          category: "tech",
          workload: 4,
        },
      ],
    } as Awaited<ReturnType<typeof api.getCourses>>);
    vi.mocked(api.validateRoadmap).mockResolvedValue({
      data: {
        validation_results: [
          {
            semester: 1,
            valid: true,
            total_load: 4,
            messages: [],
          },
        ],
      },
    } as Awaited<ReturnType<typeof api.validateRoadmap>>);

    renderWithProviders(
      <ManualPage
        passedIds={[]}
        roadmap={[{ semester: 1, course_ids: [] }]}
        setRoadmap={setRoadmap}
      />,
    );

    expect(
      await screen.findByText("Песочница (Ручное планирование)"),
    ).toBeInTheDocument();

    await user.selectOptions(screen.getByRole("combobox"), "course-1");
    expect(setRoadmap).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "Проверить план" }));
    expect(await screen.findByText("Нагрузка: 4.0")).toBeInTheDocument();
  });
});
