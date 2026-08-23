import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { getAllCourses } from "@/entities/course/api/getAllCourses";
import { getCourseById } from "@/entities/course/api/getCourseById";
import { getDisciplineGroups } from "@/entities/disciplineGroup/api/getDisciplineGroups";
import { renderWithQuery } from "@/test/renderWithQuery";

import CourseEditPage from "../ui/CourseEditPage";

/* Mock the leaf modules, not the barrel: useCourseByIdQuery imports getCourseById
   from "./getCourseById" directly, so a barrel mock never intercepts it. */
vi.mock("@/entities/course/api/getCourseById", () => ({
  getCourseById: vi.fn(),
}));

vi.mock("@/entities/course/api/getAllCourses", () => ({
  getAllCourses: vi.fn(),
}));

vi.mock("@/entities/disciplineGroup/api/getDisciplineGroups", () => ({
  getDisciplineGroups: vi.fn(),
}));

// jsdom has no matchMedia, and HintButton/CourseCard read it. Report desktop.
const originalMatchMedia = window.matchMedia;

beforeAll(() => {
  window.matchMedia = vi.fn(() => ({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })) as unknown as typeof window.matchMedia;
});

afterAll(() => {
  window.matchMedia = originalMatchMedia;
});

const COURSE_ID = "8e26a091-0000-4000-8000-00000000abcd";
const PREREQ_ID = "8e26a091-0000-4000-8000-00000000bbbb";
const BOX_A_ID = "8e26a091-0000-4000-8000-00000000ccc1";
const BOX_B_ID = "8e26a091-0000-4000-8000-00000000ccc2";
const COREQ_ID = "8e26a091-0000-4000-8000-00000000dddd";

const courseDto = (overrides = {}) => ({
  id: COURSE_ID,
  title: "Линейная алгебра и геометрия 2",
  description: "Описание для модераторов",
  by_major_type: "elective",
  category: "tech",
  handbook_link: null,
  available_semesters: [1, 2],
  workload: 3,
  lectures_week: 2,
  seminars_week: 1,
  prerequisites: [
    { group_id: "group-1", course_ids: [PREREQ_ID] },
    { group_id: "group-2", course_ids: [BOX_A_ID, BOX_B_ID] },
  ],
  corequisites: [COREQ_ID],
  ...overrides,
});

const listDto = () =>
  [
    { id: PREREQ_ID, title: "Линейная алгебра 1" },
    { id: BOX_A_ID, title: "Дискретная математика" },
    { id: BOX_B_ID, title: "Теория множеств" },
    { id: COREQ_ID, title: "Математический анализ" },
  ].map((course) => ({
    ...courseDto(),
    ...course,
    prerequisites: [],
    corequisites: [],
  }));

const groupsDto = () => [
  {
    id: "8e26a091-0000-4000-8000-00000000ee11",
    title: "Коробка выбора математики",
    category: "prerequisite",
    root_box_id: "8e26a091-0000-4000-8000-00000000ee22",
    math_expression: {
      type: "logical",
      logical_op: "or",
      min_count: 1,
      children: [
        { type: "course", course_id: BOX_A_ID, title: "Дискретная математика" },
        { type: "course", course_id: BOX_B_ID, title: "Теория множеств" },
      ],
    },
  },
];

const renderPage = (dto = courseDto()) => {
  vi.mocked(getCourseById).mockResolvedValue(dto as never);
  vi.mocked(getAllCourses).mockResolvedValue(listDto() as never);
  vi.mocked(getDisciplineGroups).mockResolvedValue(groupsDto() as never);

  return renderWithQuery(
    <Routes>
      <Route path="/admin/courses/:courseId" element={<CourseEditPage />} />
    </Routes>,
    { route: `/admin/courses/${COURSE_ID}` },
  );
};

describe("CourseEditPage", () => {
  it("renders the course header and all three blocks", async () => {
    renderPage();

    expect(
      await screen.findByRole("heading", {
        name: "Линейная алгебра и геометрия 2",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Описание для модераторов")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Настройки курса" }),
    ).toBeInTheDocument();

    expect(screen.getByText("Настройки")).toBeInTheDocument();
    expect(
      screen.getByText("Пререквизиты (курсы или коробки)"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Кореквизиты (курсы или коробки)"),
    ).toBeInTheDocument();
  });

  it("seeds the settings controls from the course", async () => {
    renderPage();

    // Wait for the course before asserting: the chips render immediately with
    // an empty selection, and the effect seeds them only once data lands.
    await screen.findByRole("heading", {
      name: "Линейная алгебра и геометрия 2",
    });

    // available_semesters [1, 2] -> those two chips start active.
    const semester1 = screen.getByText("1", { selector: "span" });
    expect(semester1).toHaveAttribute("data-active", "true");

    // Три ряда табов: год (первый вариант, не из курса), лекции, семинары.
    const selected = screen
      .getAllByRole("tab", { selected: true })
      .map((tab) => tab.textContent);
    expect(selected).toEqual(["2024", "2", "1"]);
  });

  it("toggles a semester chip and clears the selection", async () => {
    renderPage();

    // Settle the seeding effect first, so it cannot reset the toggle mid-test.
    await screen.findByRole("heading", {
      name: "Линейная алгебра и геометрия 2",
    });

    const semester3 = screen.getByText("3", { selector: "span" });
    expect(semester3).toHaveAttribute("data-active", "false");

    await userEvent.click(semester3);
    expect(semester3).toHaveAttribute("data-active", "true");

    await userEvent.click(screen.getByLabelText("Очистить"));
    expect(semester3).toHaveAttribute("data-active", "false");
  });

  it("renders a card per requisite, collapsing a group into one box card", async () => {
    renderPage();

    expect(await screen.findByText("Линейная алгебра 1")).toBeInTheDocument();
    // Two courses in one prerequisite group render as a single "коробка" card.
    expect(
      screen.getByText("Дискретная математика / Теория множеств"),
    ).toBeInTheDocument();
    expect(screen.getByText("Математический анализ")).toBeInTheDocument();
  });

  it("falls back to the empty-state add button when there are no requisites", async () => {
    renderPage(courseDto({ prerequisites: [], corequisites: [] }));

    const addButtons = await screen.findAllByRole("button", {
      name: /Курс\/коробка/,
    });
    expect(addButtons).toHaveLength(2);
  });
});

describe("CourseEditPage — настройки", () => {
  it("starts год and тип at their first option, not at the course's values", async () => {
    // The course is category "tech" and has no cohort, but these two controls
    // deliberately do not track it.
    renderPage();

    await screen.findByRole("heading", {
      name: "Линейная алгебра и геометрия 2",
    });

    expect(screen.getByRole("tab", { name: "2024" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("combobox")).toHaveTextContent("ИИ");
  });
});

describe("CourseEditPage — выбор пререквизитов", () => {
  /* Radix marks body pointer-events:none while a dialog is open, which
     user-event refuses to click through. */
  const user = () => userEvent.setup({ pointerEventsCheck: 0 });

  const openPicker = async () => {
    renderPage();
    const [addButton] = await screen.findAllByRole("button", {
      name: /Курс\/коробка/,
    });
    await user().click(addButton);
    return screen.getByRole("dialog");
  };

  it("opens the picker from the panel's add button", async () => {
    const dialog = await openPicker();

    expect(
      within(dialog).getByText("Доступные курсы/коробки"),
    ).toBeInTheDocument();
    expect(within(dialog).getByRole("tab", { name: "Курсы" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("excludes the course being edited from the Курсы tab", async () => {
    const dialog = await openPicker();

    expect(
      await within(dialog).findByText("Линейная алгебра 1"),
    ).toBeInTheDocument();
    expect(
      within(dialog).queryByText("Линейная алгебра и геометрия 2"),
    ).not.toBeInTheDocument();
  });

  it("swaps the grid to boxes on the Коробки tab", async () => {
    const dialog = await openPicker();
    await within(dialog).findByText("Линейная алгебра 1");

    await user().click(within(dialog).getByRole("tab", { name: "Коробки" }));

    expect(
      await within(dialog).findByText("Коробка выбора математики"),
    ).toBeInTheDocument();
    expect(within(dialog).getByText("2 объекта")).toBeInTheDocument();
    expect(within(dialog).getByText("1 из 2")).toBeInTheDocument();
    expect(
      within(dialog).queryByText("Линейная алгебра 1"),
    ).not.toBeInTheDocument();
  });

  it("marks a picked card without closing the modal", async () => {
    const dialog = await openPicker();
    const card = await within(dialog).findByRole("button", {
      name: /Линейная алгебра 1/,
    });
    expect(card).toHaveAttribute("aria-pressed", "false");

    await user().click(card);

    expect(card).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("narrows the grid by search", async () => {
    const dialog = await openPicker();
    await within(dialog).findByText("Линейная алгебра 1");

    await user().type(
      within(dialog).getByPlaceholderText(/Поиск/),
      "дискретная",
    );

    expect(
      await within(dialog).findByText("Дискретная математика"),
    ).toBeInTheDocument();
    expect(
      within(dialog).queryByText("Линейная алгебра 1"),
    ).not.toBeInTheDocument();
  });
});

describe("CourseEditPage — состояние пикера", () => {
  const user = () => userEvent.setup({ pointerEventsCheck: 0 });

  /* Each picker opens clean. Note this holds both because the two modals keep
     separate local state AND because each resets on close, so it does not by
     itself prove isolation — it pins the user-visible behaviour either way. */
  it("opens each picker with an empty search on the Курсы tab", async () => {
    renderPage();

    const [prereqAdd, coreqAdd] = await screen.findAllByRole("button", {
      name: /Курс\/коробка/,
    });

    await user().click(prereqAdd);
    const prereqDialog = screen.getByRole("dialog");
    await within(prereqDialog).findByText("Линейная алгебра 1");
    await user().type(
      within(prereqDialog).getByPlaceholderText(/Поиск/),
      "дискретная",
    );
    await user().click(
      within(prereqDialog).getByRole("tab", { name: "Коробки" }),
    );
    await user().keyboard("{Escape}");

    await user().click(coreqAdd);
    const coreqDialog = await screen.findByRole("dialog");

    expect(within(coreqDialog).getByPlaceholderText(/Поиск/)).toHaveValue("");
    expect(
      within(coreqDialog).getByRole("tab", { name: "Курсы" }),
    ).toHaveAttribute("aria-selected", "true");
  });
});
