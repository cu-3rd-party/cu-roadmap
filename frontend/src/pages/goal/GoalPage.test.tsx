import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GoalPage } from "./index";
import { api } from "@/shared/config";
import { renderWithProviders } from "@/test/render";

vi.mock("@/shared/config", async () => {
  const actual = await vi.importActual<typeof import("@/shared/config")>(
    "@/shared/config",
  );

  return {
    ...actual,
    api: {
      ...actual.api,
      getCourses: vi.fn(),
      generateGoalPath: vi.fn(),
    },
  };
});

describe("GoalPage", () => {
  it("loads courses and renders the generated path", async () => {
    const user = userEvent.setup();

    vi.mocked(api.getCourses).mockResolvedValue({
      data: [{ id: "course-1", title: "Python Basics", category: "tech", workload: 4 }],
    } as Awaited<ReturnType<typeof api.getCourses>>);
    vi.mocked(api.generateGoalPath).mockResolvedValue({
      data: {
        roadmap: [
          {
            semester: 1,
            total_load: 4,
            courses: [
              { id: "course-1", title: "Python Basics", category: "tech", workload: 4 },
            ],
          },
        ],
      },
    } as Awaited<ReturnType<typeof api.generateGoalPath>>);

    renderWithProviders(<GoalPage passedIds={[]} />);

    expect(await screen.findByText("Python Basics")).toBeInTheDocument();

    await user.selectOptions(screen.getByRole("combobox"), "course-1");
    await user.click(screen.getByRole("button", { name: "Построить путь" }));

    expect(await screen.findByText("Семестр 1")).toBeInTheDocument();
    expect(screen.getAllByText("Python Basics").length).toBeGreaterThan(0);
  });
});
