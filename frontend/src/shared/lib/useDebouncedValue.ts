import { useEffect, useState } from "react";

/*
 Returns a copy of `value` that only updates after `delayMs` have elapsed
 without `value` changing. The initial value is returned immediately (no
 delay on mount), so first render fires right away and only subsequent rapid
 changes are debounced.
*/

export const useDebouncedValue = <T>(value: T, delayMs: number): T => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);

  return debounced;
};
