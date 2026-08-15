import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// We run with `globals: false`, so RTL's automatic per-test cleanup (which keys
// off a global afterEach) never registers. Unmount mounted trees explicitly to
// keep document.body clean between tests.
afterEach(() => {
  cleanup();
});
