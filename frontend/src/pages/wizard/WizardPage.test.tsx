import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WizardPage } from "./index";
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
      getMajors: vi.fn(),
      generateRoadmap: vi.fn(),
    },
  };
});

describe("WizardPage", () => {
  it("walks through the wizard and renders roadmap results", async () => {
    const user = userEvent.setup();
    const setPassedIds = vi.fn();
    const setRoadmapData = vi.fn();
    const setLoading = vi.fn();

    vi.mocked(api.getCourses).mockResolvedValue({
      data: [{ id: "course-1", title: "Python Basics", category: "tech", workload: 4 }],
    } as Awaited<ReturnType<typeof api.getCourses>>);
    vi.mocked(api.getMajors).mockResolvedValue({
      data: [{ id: "major-1", title: "Software Engineering" }],
    } as Awaited<ReturnType<typeof api.getMajors>>);
    vi.mocked(api.generateRoadmap).mockResolvedValue({
      data: {
        roadmap: [
          {
            semester: 1,
            total_load: 4,
            courses: [
              {
                id: "course-1",
                title: "Python Basics",
                category: "tech",
                workload: 4,
              },
            ],
          },
        ],
      },
    } as Awaited<ReturnType<typeof api.generateRoadmap>>);

    renderWithProviders(
      <WizardPage
        passedIds={["course-1"]}
        setPassedIds={setPassedIds}
        roadmapData={null}
        setRoadmapData={setRoadmapData}
        loading={false}
        setLoading={setLoading}
      />,
    );

    await screen.findByText("Python Basics");
    await user.click(screen.getByRole("button", { name: /Далее/i }));
    await user.click(screen.getByRole("button", { name: /Построить траектории/i }));

    expect(api.generateRoadmap).toHaveBeenCalled();
    expect(setLoading).toHaveBeenCalledWith(true);
    expect(setRoadmapData).toHaveBeenCalled();
  });
});
