import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { CollapsiblePanel } from "../panel";

describe("CollapsiblePanel", () => {
  it("shows its content open by default", () => {
    render(
      <CollapsiblePanel title="Section">
        <p>body content</p>
      </CollapsiblePanel>,
    );
    expect(screen.getByText("body content")).toBeInTheDocument();
    expect(screen.getByRole("button")).toHaveAttribute("aria-expanded", "true");
  });

  it("respects defaultOpen=false", () => {
    render(
      <CollapsiblePanel title="Section" defaultOpen={false}>
        <p>body content</p>
      </CollapsiblePanel>,
    );
    expect(screen.queryByText("body content")).not.toBeInTheDocument();
    expect(screen.getByRole("button")).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("toggles open/closed when the trigger is clicked", async () => {
    const { container } = render(
      <CollapsiblePanel title="Section">
        <p>body content</p>
      </CollapsiblePanel>,
    );
    const toggle = screen.getByRole("button");
    const root = container.querySelector('[data-slot="collapsible-panel"]');

    await userEvent.click(toggle);
    // data-state and aria-expanded flip synchronously via React state, even
    // while the framer-motion exit animation is still running.
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(root).toHaveAttribute("data-state", "closed");

    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(root).toHaveAttribute("data-state", "open");
    expect(screen.getByText("body content")).toBeInTheDocument();
  });
});
