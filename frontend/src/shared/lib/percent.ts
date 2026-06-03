export const toPercent = (count: number, total: number) =>
  total > 0 ? Math.round((count / total) * 100) : 0;
