import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Button } from "../button";

describe("Button", () => {
  it("renders its children", () => {
    render(<Button>Click me</Button>);
    expect(
      screen.getByRole("button", { name: "Click me" }),
    ).toBeInTheDocument();
  });

  it("fires onClick when enabled", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Go</Button>);
    await userEvent.click(screen.getByRole("button", { name: "Go" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("is disabled and does not fire onClick while loading", async () => {
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Saving
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Saving" });
    expect(button).toBeDisabled();
    expect(button.className).toContain("animate-pulse");
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("does not fire onClick when disabled", async () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Nope
      </Button>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Nope" }));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("renders icon-only content when given an icon and no children", () => {
    render(<Button aria-label="settings" icon={<svg data-testid="icon" />} />);
    const button = screen.getByRole("button", { name: "settings" });
    expect(button).toContainElement(screen.getByTestId("icon"));
    // icon-only buttons get a square size class, never horizontal padding
    expect(button.className).toMatch(/size-\d/);
  });

  it("renders the underlying child element when asChild is set", () => {
    render(
      <Button asChild>
        <a href="/somewhere">link</a>
      </Button>,
    );
    const link = screen.getByRole("link", { name: "link" });
    expect(link).toBeInTheDocument();
    // asChild composes onto the <a>, so there is no <button>
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
