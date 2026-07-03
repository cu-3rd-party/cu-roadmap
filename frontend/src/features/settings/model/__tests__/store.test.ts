import { beforeEach, describe, expect, it } from "vitest";

import { useSettingsStore } from "../store";

beforeEach(() => {
  localStorage.clear();
  useSettingsStore.setState({
    hasSeenGreeting: false,
    admissionYear: null,
    hideCompletedSemesters: false,
    majorId: null,
  });
});

describe("useSettingsStore", () => {
  it("completeGreeting marks the greeting seen and records the admission year", () => {
    useSettingsStore.getState().completeGreeting(2025);
    const state = useSettingsStore.getState();
    expect(state.hasSeenGreeting).toBe(true);
    expect(state.admissionYear).toBe(2025);
  });

  it("setAdmissionYear updates the admission year", () => {
    useSettingsStore.getState().setAdmissionYear(2024);
    expect(useSettingsStore.getState().admissionYear).toBe(2024);
  });

  it("setMajorId sets and clears the major id", () => {
    useSettingsStore.getState().setMajorId("m1");
    expect(useSettingsStore.getState().majorId).toBe("m1");
    useSettingsStore.getState().setMajorId(null);
    expect(useSettingsStore.getState().majorId).toBeNull();
  });

  it("setHideCompletedSemesters toggles the flag", () => {
    useSettingsStore.getState().setHideCompletedSemesters(true);
    expect(useSettingsStore.getState().hideCompletedSemesters).toBe(true);
  });

  it("persists the data fields (not the actions)", () => {
    useSettingsStore.getState().completeGreeting(2026);
    useSettingsStore.getState().setMajorId("m2");
    useSettingsStore.getState().setHideCompletedSemesters(true);

    const persisted = JSON.parse(localStorage.getItem("settings") as string);
    expect(persisted.state).toEqual({
      hasSeenGreeting: true,
      admissionYear: 2026,
      majorId: "m2",
      hideCompletedSemesters: true,
    });
  });
});
