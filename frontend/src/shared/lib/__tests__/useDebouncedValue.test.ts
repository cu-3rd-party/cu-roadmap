import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useDebouncedValue } from "../useDebouncedValue";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useDebouncedValue", () => {
  it("returns the initial value immediately", () => {
    const { result } = renderHook(({ v }) => useDebouncedValue(v, 500), {
      initialProps: { v: "a" },
    });
    expect(result.current).toBe("a");
  });

  it("holds the old value until the delay elapses", () => {
    const { result, rerender } = renderHook(
      ({ v }) => useDebouncedValue(v, 500),
      { initialProps: { v: "a" } },
    );

    rerender({ v: "b" });
    expect(result.current).toBe("a");

    act(() => vi.advanceTimersByTime(499));
    expect(result.current).toBe("a");

    act(() => vi.advanceTimersByTime(1));
    expect(result.current).toBe("b");
  });

  it("resets the timer on rapid changes and only lands the latest value", () => {
    const { result, rerender } = renderHook(
      ({ v }) => useDebouncedValue(v, 500),
      { initialProps: { v: "a" } },
    );

    rerender({ v: "b" });
    act(() => vi.advanceTimersByTime(300));
    rerender({ v: "c" });

    // 300ms since the last change — under the 500ms threshold.
    act(() => vi.advanceTimersByTime(300));
    expect(result.current).toBe("a");

    act(() => vi.advanceTimersByTime(200));
    expect(result.current).toBe("c");
  });
});
