/* Prefix-aware so a detail route keeps its section lit in the navbar:
   /admin/courses/<uuid> still marks "Курсы" active. "/" is exact — every path
   starts with it. */
export const isPathActive = (path: string) => {
  if (path === "/") return location.pathname === "/";
  return location.pathname === path || location.pathname.startsWith(`${path}/`);
};
