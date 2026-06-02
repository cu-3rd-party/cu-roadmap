export const getInsertedText = (prev: string, next: string) => {
  let start = 0;
  while (
    start < prev.length &&
    start < next.length &&
    prev[start] === next[start]
  ) {
    start++;
  }
  let prevEnd = prev.length;
  let nextEnd = next.length;
  while (
    prevEnd > start &&
    nextEnd > start &&
    prev[prevEnd - 1] === next[nextEnd - 1]
  ) {
    prevEnd--;
    nextEnd--;
  }
  return next.slice(start, nextEnd);
};