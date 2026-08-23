import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createSpecialization } from "@/entities/specialization";
import { renderWithQuery } from "@/test/renderWithQuery";

import {
  NEW_SPECIALIZATION_TITLE,
  useCreateSpecializationMutation,
} from "../useCreateSpecializationMutation";

vi.mock("@/entities/specialization", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/specialization")>()),
  createSpecialization: vi.fn(),
}));

const mockedCreate = vi.mocked(createSpecialization);

const MAJOR_ID = "8e26a091-0000-4000-8000-0000000000aa";
const NEW_ID = "8e26a091-0000-4000-8000-00000000abcd";

// A bare button standing in for "Добавить специализацию", next to the editor
// route it should land on — so the assertion is against the router, not a string.
const AddButton = () => {
  const { mutate } = useCreateSpecializationMutation();
  return (
    <button type="button" onClick={() => mutate(MAJOR_ID)}>
      Добавить специализацию
    </button>
  );
};

const renderFlow = () =>
  renderWithQuery(
    <Routes>
      <Route path="/admin/specializations" element={<AddButton />} />
      <Route
        path="/admin/specializations/:specializationId/restrictions"
        element={<p>ограничения</p>}
      />
    </Routes>,
    { route: "/admin/specializations" },
  );

describe("useCreateSpecializationMutation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates the stub specialization under the selected major and opens it", async () => {
    mockedCreate.mockResolvedValue(NEW_ID);
    renderFlow();

    await userEvent.click(screen.getByRole("button"));

    expect(mockedCreate).toHaveBeenCalledWith({
      major_id: MAJOR_ID,
      title: NEW_SPECIALIZATION_TITLE,
    });
    expect(await screen.findByText("ограничения")).toBeInTheDocument();
  });

  it("stays put when the request fails", async () => {
    mockedCreate.mockRejectedValue(new Error("нет связи"));
    renderFlow();

    await userEvent.click(screen.getByRole("button"));

    await waitFor(() => expect(mockedCreate).toHaveBeenCalled());
    expect(screen.queryByText("ограничения")).not.toBeInTheDocument();
  });
});
