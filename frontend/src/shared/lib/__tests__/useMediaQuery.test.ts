import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useMediaQuery } from "../useMediaQuery";

type Listener = () => void;

const original = window.matchMedia;

const setupMatchMedia = (initialMatches: boolean) => {
  let matches = initialMatches;
  let listener: Listener | null = null;

  const mql = {
    media: "",
    get matches() {
      return matches;
    },
    addEventListener: (_type: string, l: Listener) => {
      listener = l;
    },
    removeEventListener: vi.fn(),
  };

  const matchMedia = vi.fn((query: string) => {
    mql.media = query;
    return mql as unknown as MediaQueryList;
  });
  window.matchMedia = matchMedia as unknown as typeof window.matchMedia;

  return {
    matchMedia,
    mql,
    setMatches: (value: boolean) => {
      matches = value;
      listener?.();
    },
  };
};

afterEach(() => {
  window.matchMedia = original;
});

describe("useMediaQuery", () => {
  it("resolves a named breakpoint to its query string", () => {
    const { matchMedia } = setupMatchMedia(false);
    renderHook(() => useMediaQuery("md"));
    expect(matchMedia).toHaveBeenCalledWith("(max-width: 767.98px)");
  });

  it("passes a raw query string through unchanged", () => {
    const { matchMedia } = setupMatchMedia(false);
    renderHook(() => useMediaQuery("(min-width: 900px)"));
    expect(matchMedia).toHaveBeenCalledWith("(min-width: 900px)");
  });

  it("returns the initial match state", () => {
    setupMatchMedia(true);
    const { result } = renderHook(() => useMediaQuery("sm"));
    expect(result.current).toBe(true);
  });

  it("updates when the media query change listener fires", () => {
    const env = setupMatchMedia(false);
    const { result } = renderHook(() => useMediaQuery("lg"));
    expect(result.current).toBe(false);

    act(() => env.setMatches(true));
    expect(result.current).toBe(true);
  });

  it("removes its listener on unmount", () => {
    const env = setupMatchMedia(false);
    const { unmount } = renderHook(() => useMediaQuery("sm"));
    unmount();
    expect(env.mql.removeEventListener).toHaveBeenCalled();
  });
});
