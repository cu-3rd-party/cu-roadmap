import { useEffect, useMemo, useState } from "react";

import { useCoursesQuery } from "@/entities/course";
import {
  buildGenerateRoadmapRequest,
  buildGoalPathRequest,
  useGenerateRoadmapMutation,
  useGoalPathMutation,
  usePlannerStore,
} from "@/entities/roadmap";
import type { Roadmap } from "@/entities/roadmap";
import type { CourseSource } from "@/entities/roadmap/api";
import { useSpecializationsQuery } from "@/entities/specialization";
import { useSettingsStore } from "@/features/settings";
import { getErrorMessage } from "@/shared/api";
import { admissionYearToSemester } from "@/shared/constants";
import type { SemesterNumber } from "@/shared/constants";

import { getCourseHints, getInsertedText, getSemesterOptions } from "../lib";

// Allowed weekly load range (pairs per week) for roadmap generation.
export const MIN_LOAD = 12;
export const MAX_LOAD = 26;

// Holds the whole trajectory-select form state machine: the two tabs (major /
// course goal), the course search combobox, submission, and soft/hard errors.
// The modal shell and its tab components are pure consumers of this hook.
export const useTrajectorySelect = (onOpenChange: (open: boolean) => void) => {
  const { admissionYear, majorId } = useSettingsStore();
  const { data: courses } = useCoursesQuery(admissionYear, majorId);
  // The major itself is chosen in Settings; here we only pick a specialization
  // of that major.
  const { addCourse, markGenerated } = usePlannerStore();
  const { data: specializations } = useSpecializationsQuery(majorId);
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
  const [specializationId, setSpecializationId] = useState("");
  const [error, setError] = useState<string | null>(null);
  // Which of the already-saved courses count as "passed" for the generate
  const [scope, setScope] = useState<CourseSource>("passed");
  const [maxLoad, setMaxLoad] = useState(MIN_LOAD);

  // "Нет" ("") is always a valid choice and the default. Only clear a stale
  // specialization id that no longer belongs to the current major (e.g. after
  // the major is switched in Settings) — never force a default selection.
  useEffect(() => {
    const ids = specializations?.map((s) => s.id) ?? [];
    if (specializationId !== "" && !ids.includes(specializationId)) {
      setSpecializationId("");
    }
  }, [specializations, specializationId]);

  // The major comes from Settings; submitting only needs that to be set (a
  // blank specialization — the "Нет" tab — is allowed).
  const canSubmit =
    tab === "major" ? majorId != null : courseId !== "" && semester !== "";

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

  const handleSpecializationChange = (value: string) => {
    setError(null);
    setSpecializationId(value);
  };

  const handleScopeChange = (value: string) => {
    setError(null);
    setScope(value as CourseSource);
  };

  const handleMaxLoadChange = (value: number) => {
    // The slider is always in-range, but the number field can emit NaN or an
    // out-of-range value, so clamp defensively here.
    if (Number.isNaN(value)) return;
    setMaxLoad(Math.min(MAX_LOAD, Math.max(MIN_LOAD, Math.round(value))));
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
            specializationId,
            scope,
            maxLoad,
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
    // specialization tab
    specializations,
    specializationId,
    onSpecializationChange: handleSpecializationChange,
    maxLoad,
    onMaxLoadChange: handleMaxLoadChange,
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
