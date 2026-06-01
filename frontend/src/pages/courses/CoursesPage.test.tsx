import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CoursesPage } from "./index";
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
    },
  };
});

describe("CoursesPage", () => {
  it("loads courses and toggles passed ids", async () => {
    const user = userEvent.setup();
    const setPassedIds = vi.fn();
    vi.mocked(api.getCourses).mockResolvedValue({
      data: [
        {
          id: "course-1",
          title: "Python Basics",

          workload: 4,
          description: "Intro course",
          prerequisites: [],
          postrequisites: [],
        },
      ],
    } as Awaited<ReturnType<typeof api.getCourses>>);

    renderWithProviders(
      <CoursesPage passedIds={[]} setPassedIds={setPassedIds} />,
    );

    expect(await screen.findByText("Python Basics")).toBeInTheDocument();

    await user.click(screen.getByText("Python Basics"));

    await waitFor(() => {
      expect(setPassedIds).toHaveBeenCalledTimes(1);
    });
  });
});
