import { useMemo, useState } from "react";

import { useCoursesQuery } from "@/entities/course";
import { useMajorsQuery } from "@/entities/major";
import {
  buildGenerateRoadmapRequest,
  buildGoalPathRequest,
  useGenerateRoadmapMutation,
  useGoalPathMutation,
  usePlannerStore,
} from "@/entities/roadmap";
import type { Roadmap } from "@/entities/roadmap";
import type { CourseSource } from "@/entities/roadmap/api";
import { useSettingsStore } from "@/features/settings";
import { getErrorMessage } from "@/shared/api";
import { admissionYearToSemester } from "@/shared/constants";
import type { SemesterNumber } from "@/shared/constants";

import { getCourseHints, getInsertedText, getSemesterOptions } from "../lib";

// Holds the whole trajectory-select form state machine: the two tabs (major /
// course goal), the course search combobox, submission, and soft/hard errors.
// The modal shell and its tab components are pure consumers of this hook.
export const useTrajectorySelect = (onOpenChange: (open: boolean) => void) => {
  const { admissionYear } = useSettingsStore();
  const { data: courses } = useCoursesQuery(admissionYear);
  const { data: majors } = useMajorsQuery(admissionYear);
  const { addCourse, markGenerated } = usePlannerStore();
  const { mutateAsync: generateRoadmap, isPending } =
    useGenerateRoadmapMutation();
  const { mutateAsync: generateGoalPath, isPending: goalPending } =
    useGoalPathMutation();

  const [courseQuery, setCourseQuery] = useState("");
  const [courseId, setCourseId] = useState("");
  const [courseOpen, setCourseOpen] = useState(false);
  const [courseCommitted, setCourseCommitted] = useState(true);
  const [semester, setSemester] = useState("any");
  const [tab, setTab] = useState("major");
  const [majorId, setMajorId] = useState("");
  const [error, setError] = useState<string | null>(null);
  // Which of the already-saved courses count as "passed" for the generate
  const [scope, setScope] = useState<CourseSource>("passed");

  const canSubmit =
    tab === "major" ? majorId !== "" : courseId !== "" && semester !== "";

  // Course tab: only target semesters at or after the cohort's current semester.
  const minSemester =
    admissionYear != null ? admissionYearToSemester[admissionYear] : 1;

  const savedCourseTitle =
    courses?.find((course) => course.id === courseId)?.title ?? "";

  const courseHints = useMemo(
    () => getCourseHints(courses, courseQuery),
    [courseQuery, courses],
  );

  const semesterOptions = useMemo(
    () => getSemesterOptions(courses, courseId, minSemester),
    [courses, courseId, minSemester],
  );

  // The course field always shows a committed option (or nothing). Typing over a
  // committed value wipes it so the user can search again; blurring without
  // picking anything restores the last saved option.
  const handleCourseChange = (value: string) => {
    setError(null);
    if (courseCommitted) {
      setCourseCommitted(false);
      setCourseQuery(getInsertedText(savedCourseTitle, value));
    } else {
      setCourseQuery(value);
    }
    setCourseOpen(true);
  };

  const handleCourseBlur = () => {
    setCourseQuery(savedCourseTitle);
    setCourseCommitted(true);
    setCourseOpen(false);
  };

  const selectCourse = (id: string, title: string) => {
    setError(null);
    setCourseId(id);
    setCourseQuery(title);
    setCourseCommitted(true);
    setCourseOpen(false);
    // Switching the course invalidates the previously picked semester.
    setSemester("any");
  };

  // Tab/option switches all clear the previous error so a stale message can't
  // outlive the input it referred to.
  const handleTabChange = (value: string) => {
    setError(null);
    setTab(value);
  };

  const handleMajorChange = (value: string) => {
    setError(null);
    setMajorId(value);
  };

  const handleScopeChange = (value: string) => {
    setError(null);
    setScope(value as CourseSource);
  };

  const handleSemesterChange = (value: string) => {
    setError(null);
    setSemester(value);
  };

  const close = () => onOpenChange(false);

  // Merge a generated/goal-path roadmap into the plan (addCourse dedups per
  // semester) and mark the added courses for the blue highlight.
  const applyRoadmap = (result: Roadmap) => {
    const selections = usePlannerStore.getState().selections;
    const existingIds = new Set(
      Object.values(selections).flatMap((list) => list.map((c) => c.id)),
    );
    const newGeneratedIds: string[] = [];
    const byId = new Map((courses ?? []).map((course) => [course.id, course]));

    for (const { semester: sem, courseIds } of result.semesters) {
      for (const id of courseIds) {
        const course = byId.get(id);
        addCourse(
          sem,
          course
            ? {
                id: course.id,
                title: course.title,
                category: course.category,
                type: course.type,
              }
            : { id, title: id },
        );
        if (!existingIds.has(id)) {
          newGeneratedIds.push(id);
        }
      }
    }
    markGenerated(newGeneratedIds);
  };

  const handleSubmit = async () => {
    if (admissionYear == null) {
      close();
      return;
    }
    const selections = usePlannerStore.getState().selections;
    setError(null);

    try {
      if (tab === "major") {
        if (!majorId) {
          close();
          return;
        }
        const result = await generateRoadmap(
          buildGenerateRoadmapRequest(
            selections,
            admissionYear,
            majorId,
            scope,
          ),
        );
        // Soft error from the backend: surface it and keep the modal open.
        if (result.error) {
          setError(result.error);
          return;
        }
        applyRoadmap(result);
      } else {
        if (!courseId || semester === "") {
          close();
          return;
        }
        const goalSemester =
          semester === "any" ? undefined : (Number(semester) as SemesterNumber);
        const result = await generateGoalPath(
          buildGoalPathRequest(
            selections,
            admissionYear,
            courseId,
            goalSemester,
          ),
        );
        if (result.error) {
          setError(result.error);
          return;
        }
        applyRoadmap(result);
      }
    } catch (e) {
      // Keep the modal open and show why (backend error body / status / network).
      setError(getErrorMessage(e));
      return;
    }

    close();
  };

  return {
    // shell
    tab,
    error,
    canSubmit,
    loading: isPending || goalPending,
    onTabChange: handleTabChange,
    onSubmit: handleSubmit,
    close,
    // major tab
    majors,
    majorId,
    onMajorChange: handleMajorChange,
    scope,
    onScopeChange: handleScopeChange,
    // course tab
    courseQuery,
    courseOpen,
    courseHints,
    courseId,
    onCourseChange: handleCourseChange,
    onCourseBlur: handleCourseBlur,
    onSelectCourse: selectCourse,
    semester,
    semesterOptions,
    onSemesterChange: handleSemesterChange,
  };
};
