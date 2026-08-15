// cn/useMediaQuery live in @cu/ui (the kit depends on them); re-exported here
// so `@/shared/lib` stays the single import site for app code.
export { cn, useMediaQuery } from "@cu/ui/lib";

export { isPathActive } from "./router";
