import { useEffect, useState } from "react";

/*
 Subscribes to a CSS media query and returns whether it currently matches.
 Initialises synchronously from `window.matchMedia` so there is no flash of
 the wrong layout on first render (client-only SPA, no SSR to worry about).
*/

const BREAKPOINTS = {
  sm: "(max-width: 639.98px)",
  md: "(max-width: 767.98px)",
  lg: "(max-width: 1023.98px)",
} as const;

type Breakpoint = keyof typeof BREAKPOINTS;

export const useMediaQuery = (query: Breakpoint | (string & {})): boolean => {
  const resolved =
    query in BREAKPOINTS ? BREAKPOINTS[query as Breakpoint] : query;

  const [matches, setMatches] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(resolved).matches : false,
  );

  useEffect(() => {
    const mql = window.matchMedia(resolved);
    const onChange = () => setMatches(mql.matches);

    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [resolved]);

  return matches;
};
