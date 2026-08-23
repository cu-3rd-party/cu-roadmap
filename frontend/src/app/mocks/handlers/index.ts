import { structureHandlers } from "./structure";

// Every mock handler group the worker registers. Add new groups here rather
// than in browser.ts.
export const handlers = [...structureHandlers];

export { resetStructureMock } from "./structure";
