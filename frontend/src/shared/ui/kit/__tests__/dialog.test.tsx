import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "../dialog";

const Fixture = (props: React.ComponentProps<typeof Dialog>) => (
  <Dialog {...props}>
    <DialogTrigger>Open</DialogTrigger>
    <DialogContent>
      <DialogTitle>Dialog title</DialogTitle>
      <p>dialog body</p>
    </DialogContent>
  </Dialog>
);

describe("Dialog", () => {
  it("hides its content until opened (uncontrolled)", () => {
    render(<Fixture />);
    expect(screen.queryByText("dialog body")).not.toBeInTheDocument();
  });

  it("opens when the trigger is clicked (uncontrolled)", async () => {
    render(<Fixture />);
    await userEvent.click(screen.getByRole("button", { name: "Open" }));
    expect(screen.getByText("dialog body")).toBeInTheDocument();
  });

  it("renders content immediately when controlled open", () => {
    render(<Fixture open />);
    expect(screen.getByText("dialog body")).toBeInTheDocument();
  });

  it("does not open on trigger click when controlled open=false", async () => {
    render(<Fixture open={false} />);
    await userEvent.click(screen.getByRole("button", { name: "Open" }));
    // controlled — parent never flips `open`, so content stays hidden
    expect(screen.queryByText("dialog body")).not.toBeInTheDocument();
  });
});
