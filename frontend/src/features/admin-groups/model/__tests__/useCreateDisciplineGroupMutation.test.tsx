import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createDisciplineGroup } from "@/entities/disciplineGroup";
import type { DisciplineGroupDto } from "@/entities/disciplineGroup";
import { renderWithQuery } from "@/test/renderWithQuery";

import {
  NEW_GROUP,
  useCreateDisciplineGroupMutation,
} from "../useCreateDisciplineGroupMutation";

vi.mock("@/entities/disciplineGroup", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/disciplineGroup")>()),
  createDisciplineGroup: vi.fn(),
}));

const mockedCreate = vi.mocked(createDisciplineGroup);

const NEW_ID = "8e26a091-0000-4000-8000-00000000abcd";

const created: DisciplineGroupDto = {
  id: NEW_ID,
  title: "Новая коробка",
  category: "",
  math_expression: {},
  root_box_id: "8e26a091-0000-4000-8000-0000000000b1",
};

// A bare button standing in for "Добавить коробку", next to the editor route it
// is supposed to land on — so the assertion is against the router, not a URL
// string.
const AddButton = () => {
  const { mutate } = useCreateDisciplineGroupMutation();
  return (
    <button type="button" onClick={() => mutate()}>
      Добавить коробку
    </button>
  );
};

const renderFlow = () =>
  renderWithQuery(
    <Routes>
      <Route path="/admin/boxes" element={<AddButton />} />
      <Route path="/admin/boxes/:groupId" element={<p>редактор</p>} />
    </Routes>,
    { route: "/admin/boxes" },
  );

describe("useCreateDisciplineGroupMutation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates the stub box and opens its editor", async () => {
    mockedCreate.mockResolvedValue(created);
    renderFlow();

    await userEvent.click(screen.getByRole("button"));

    expect(mockedCreate).toHaveBeenCalledWith(NEW_GROUP);
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

describe("NEW_GROUP", () => {
  /* math_expression is `binding:"required"` on the Go side, so dropping it from
     the stub would turn every create into a 400. */
  it("spells out an empty math expression rather than omitting it", () => {
    expect(NEW_GROUP.title).toBe("Новая коробка");
    expect(NEW_GROUP.math_expression).toEqual({});
  });
});
