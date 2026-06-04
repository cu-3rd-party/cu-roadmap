import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { useTheme } from "@/app/providers";
import { renderWithProviders } from "@/test/render";

function ThemeProbe() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div>
      <span>{theme}</span>
      <button onClick={toggleTheme}>toggle</button>
    </div>
  );
}

describe("ThemeProvider", () => {
  it("toggles theme and persists it", async () => {
    localStorage.clear();
    const user = userEvent.setup();

    renderWithProviders(<ThemeProbe />);

    expect(screen.getByText("light")).toBeInTheDocument();
    expect(document.documentElement.classList.contains("dark")).toBe(false);

    await user.click(screen.getByRole("button", { name: "toggle" }));

    expect(screen.getByText("dark")).toBeInTheDocument();
    expect(localStorage.getItem("theme")).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });
});
