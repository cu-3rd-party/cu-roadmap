import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { getAllCourses } from "@/entities/course/api/getAllCourses";
import { getCourseById } from "@/entities/course/api/getCourseById";
import { getCourseDependencies } from "@/entities/course/api/getCourseDependencies";
import { getDisciplineGroups } from "@/entities/disciplineGroup/api/getDisciplineGroups";
import { renderWithQuery } from "@/test/renderWithQuery";

import CourseEditPage from "../ui/CourseEditPage";

/* Mock the leaf modules, not the barrel: the query hooks import these directly,
   so a barrel mock never intercepts them. */
vi.mock("@/entities/course/api/getCourseById", () => ({
  getCourseById: vi.fn(),
}));

vi.mock("@/entities/course/api/getAllCourses", () => ({
  getAllCourses: vi.fn(),
}));

vi.mock("@/entities/course/api/getCourseDependencies", () => ({
  getCourseDependencies: vi.fn(),
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
const BOX_ID = "8e26a091-0000-4000-8000-00000000ee11";
const COREQ_ID = "8e26a091-0000-4000-8000-00000000dddd";
const SPARE_ID = "8e26a091-0000-4000-8000-00000000ffff";

const COURSE_TITLE = "Линейная алгебра и геометрия 2";

const courseDto = (overrides = {}) => ({
  id: COURSE_ID,
  title: COURSE_TITLE,
  description: "Описание для модераторов",
  by_major_type: "elective",
  category: "swe",
  handbook_link: null,
  allowed_cohorts: [2025],
  available_semesters: [1, 2],
  workload: 3,
  lectures_week: 2,
  seminars_week: 1,
  prerequisites: [],
  corequisites: [],
  ...overrides,
});

const listDto = () =>
  [
    { id: PREREQ_ID, title: "Линейная алгебра 1" },
    { id: BOX_A_ID, title: "Дискретная математика" },
    { id: BOX_B_ID, title: "Теория множеств" },
    { id: COREQ_ID, title: "Математический анализ" },
    { id: SPARE_ID, title: "Программирование" },
  ].map((course) => ({ ...courseDto(), ...course }));

/* One plain prerequisite, one "выбор 1 из 2" box (two rows sharing a group and a
   positive alternative_group), and one corequisite. */
const dependenciesDto = () => [
  {
    id: "row-1",
    course_id: COURSE_ID,
    required_course_id: PREREQ_ID,
    required_group_id: null,
    dependency_type: "prerequisite",
    alternative_group: 0,
  },
  {
    id: "row-2",
    course_id: COURSE_ID,
    required_course_id: BOX_A_ID,
    required_group_id: BOX_ID,
    dependency_type: "prerequisite",
    alternative_group: 1,
  },
  {
    id: "row-3",
    course_id: COURSE_ID,
    required_course_id: BOX_B_ID,
    required_group_id: BOX_ID,
    dependency_type: "prerequisite",
    alternative_group: 1,
  },
  {
    id: "row-4",
    course_id: COURSE_ID,
    required_course_id: COREQ_ID,
    required_group_id: null,
    dependency_type: "corequisite",
    alternative_group: 0,
  },
];

const groupsDto = () => [
  {
    id: BOX_ID,
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

const renderPage = (dto = courseDto(), deps = dependenciesDto()) => {
  vi.mocked(getCourseById).mockResolvedValue(dto as never);
  vi.mocked(getAllCourses).mockResolvedValue(listDto() as never);
  vi.mocked(getCourseDependencies).mockResolvedValue(deps as never);
  vi.mocked(getDisciplineGroups).mockResolvedValue(groupsDto() as never);

  return renderWithQuery(
    <Routes>
      <Route path="/admin/courses/:courseId" element={<CourseEditPage />} />
    </Routes>,
    { route: `/admin/courses/${COURSE_ID}` },
  );
};

const titleField = () =>
  screen.getByRole("textbox", { name: "Название курса" });

/* Everything settles only once the course and its dependencies have both landed;
   the title field is the last thing to be seeded. */
const waitForLoad = () =>
  screen.findByDisplayValue(COURSE_TITLE, {}, { timeout: 3000 });

const user = () => userEvent.setup({ pointerEventsCheck: 0 });

describe("CourseEditPage", () => {
  it("renders the editable header and all three blocks", async () => {
    renderPage();
    await waitForLoad();

    expect(titleField()).toHaveValue(COURSE_TITLE);
    expect(screen.getByRole("textbox", { name: "Описание курса" })).toHaveValue(
      "Описание для модераторов",
    );
    // The settings gear is gone.
    expect(
      screen.queryByRole("button", { name: "Настройки курса" }),
    ).not.toBeInTheDocument();

    expect(screen.getByText("Настройки")).toBeInTheDocument();
    expect(
      screen.getByText("Пререквизиты (курсы или коробки)"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Кореквизиты (курсы или коробки)"),
    ).toBeInTheDocument();
  });

  it("seeds every settings control from the course", async () => {
    renderPage();
    await waitForLoad();

    // available_semesters [1, 2] -> those two chips start active.
    expect(screen.getByText("1", { selector: "span" })).toHaveAttribute(
      "data-active",
      "true",
    );

    // Год and Тип track the course too, so the page is not dirty on load.
    const selected = screen
      .getAllByRole("tab", { selected: true })
      .map((tab) => tab.textContent);
    expect(selected).toEqual(["2025", "2", "1"]);
    expect(screen.getByRole("combobox")).toHaveTextContent("Разработка");
  });

  it("toggles a semester chip and clears the selection", async () => {
    renderPage();
    await waitForLoad();

    const semester3 = screen.getByText("3", { selector: "span" });
    expect(semester3).toHaveAttribute("data-active", "false");

    await user().click(semester3);
    expect(semester3).toHaveAttribute("data-active", "true");

    await user().click(screen.getByLabelText("Очистить"));
    expect(semester3).toHaveAttribute("data-active", "false");
  });
});

describe("CourseEditPage — требования", () => {
  it("shows the course's real requisites, collapsing an alternative group", async () => {
    renderPage();
    await waitForLoad();

    expect(await screen.findByText("Линейная алгебра 1")).toBeInTheDocument();
    // row-2 and row-3 share a group, so they are one box card, not two.
    expect(screen.getByText("Коробка выбора математики")).toBeInTheDocument();
    expect(screen.queryByText("Дискретная математика")).not.toBeInTheDocument();
    expect(screen.getByText("Математический анализ")).toBeInTheDocument();
  });

  it("renders select-style badges for both courses and boxes", async () => {
    renderPage();
    await waitForLoad();
    await screen.findByText("Линейная алгебра 1");

    // Course card: category + type badges.
    expect(screen.getAllByText("SWE").length).toBeGreaterThan(0);
    // Box card: object count + the "or" rule.
    expect(screen.getByText("2 объекта")).toBeInTheDocument();
    expect(screen.getByText("1 из 2")).toBeInTheDocument();
  });

  it("removes a card, and every dependency row behind it", async () => {
    renderPage();
    await waitForLoad();
    await screen.findByText("Линейная алгебра 1");

    const boxCard = screen
      .getByText("Коробка выбора математики")
      .closest("div[class*='rounded-xl']") as HTMLElement;

    await user().click(
      within(boxCard).getByRole("button", { name: /Удалить/ }),
    );

    expect(
      screen.queryByText("Коробка выбора математики"),
    ).not.toBeInTheDocument();
    // The plain prerequisite is untouched.
    expect(screen.getByText("Линейная алгебра 1")).toBeInTheDocument();
  });

  it("adds a card when the picker selects a course", async () => {
    renderPage();
    await waitForLoad();
    await screen.findByText("Линейная алгебра 1");

    const [addButton] = screen.getAllByRole("button", {
      name: /Курс\/коробка/,
    });
    await user().click(addButton);

    const dialog = screen.getByRole("dialog");
    await user().click(
      await within(dialog).findByRole("button", { name: /Программирование/ }),
    );
    await user().keyboard("{Escape}");

    expect(await screen.findByText("Программирование")).toBeInTheDocument();
  });

  it("shows existing requisites as already selected in the picker", async () => {
    renderPage();
    await waitForLoad();
    await screen.findByText("Линейная алгебра 1");

    const [addButton] = screen.getAllByRole("button", {
      name: /Курс\/коробка/,
    });
    await user().click(addButton);

    const dialog = screen.getByRole("dialog");
    expect(
      await within(dialog).findByRole("button", {
        name: /Линейная алгебра 1/,
      }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      within(dialog).getByRole("button", { name: /Программирование/ }),
    ).toHaveAttribute("aria-pressed", "false");
  });
});

describe("CourseEditPage — кнопка сохранения", () => {
  const saveButton = () =>
    screen.queryByRole("button", { name: "Сохранить изменения" });

  it("is hidden while nothing has changed", async () => {
    renderPage();
    await waitForLoad();

    expect(saveButton()).not.toBeInTheDocument();
  });

  it("appears once the title changes, and hides again when it is changed back", async () => {
    renderPage();
    await waitForLoad();

    await user().type(titleField(), "!");
    expect(saveButton()).toBeInTheDocument();

    await user().type(titleField(), "{Backspace}");
    expect(saveButton()).not.toBeInTheDocument();
  });

  it("appears when a settings control changes", async () => {
    renderPage();
    await waitForLoad();

    await user().click(screen.getByText("3", { selector: "span" }));
    expect(saveButton()).toBeInTheDocument();
  });

  it("appears when a requisite is removed", async () => {
    renderPage();
    await waitForLoad();
    await screen.findByText("Линейная алгебра 1");

    const card = screen
      .getByText("Линейная алгебра 1")
      .closest("div[class*='rounded-xl']") as HTMLElement;
    await user().click(within(card).getByRole("button", { name: /Удалить/ }));

    expect(saveButton()).toBeInTheDocument();
  });

  it("does nothing when clicked — the save is not wired yet", async () => {
    renderPage();
    await waitForLoad();

    await user().type(titleField(), "!");
    await user().click(saveButton()!);

    // Still dirty, still on the page, nothing sent.
    expect(saveButton()).toBeInTheDocument();
    expect(titleField()).toHaveValue(`${COURSE_TITLE}!`);
  });
});
