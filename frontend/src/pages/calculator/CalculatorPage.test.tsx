import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CalculatorPage } from "./index";
import { api } from "@/shared/config";
import { renderWithProviders } from "@/test/render";

vi.mock("@/shared/config", async () => {
  const actual =
    await vi.importActual<typeof import("@/shared/config")>("@/shared/config");

  return {
    ...actual,
    api: {
      ...actual.api,
      identifyMajors: vi.fn(),
    },
  };
});

describe("CalculatorPage", () => {
  it("renders identified majors after calculation", async () => {
    const user = userEvent.setup();
    vi.mocked(api.identifyMajors).mockResolvedValue({
      data: [{ id: "major-1", title: "Software Engineering", score: 0.75 }],
    } as Awaited<ReturnType<typeof api.identifyMajors>>);

    renderWithProviders(<CalculatorPage passedIds={["course-1"]} />);

    await user.click(
      screen.getByRole("button", { name: "Рассчитать соответствие" }),
    );

    expect(await screen.findByText("Software Engineering")).toBeInTheDocument();
    expect(screen.getByText("75%")).toBeInTheDocument();
  });
});
