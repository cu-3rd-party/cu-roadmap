import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CourseCard } from "./CourseCard";
import { renderWithProviders } from "@/test/render";
import type { Course } from "@/shared/config";

const course: Course = {
  id: "course-1",
  title: "Python Basics",
  
  workload: 4,
  description: "Intro course",
  prerequisites: [],
  postrequisites: [],
};

describe("CourseCard", () => {
  it("calls toggle when the card is clicked", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();

    renderWithProviders(
      <CourseCard course={course} isSelected={false} onToggle={onToggle} />,
    );

    await user.click(screen.getByText("Python Basics"));

    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("opens course details without toggling selection", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();

    renderWithProviders(
      <CourseCard
        course={course}
        isSelected={false}
        onToggle={onToggle}
        allCourses={[course]}
      />,
    );

    const infoTrigger = document.querySelector(".absolute.bottom-3.right-3");
    expect(infoTrigger).not.toBeNull();

    await user.click(infoTrigger as HTMLElement);

    expect(onToggle).not.toHaveBeenCalled();
    expect(screen.getByText("Intro course")).toBeInTheDocument();
  });
});
