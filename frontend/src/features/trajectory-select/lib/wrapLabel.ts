export const wrapLabel = (text: string, maxLen = 12): string => {
  const lines: string[] = [];
  let line = "";

  for (const word of text.trim().split(/\s+/)) {
    if (!word) continue;

    if (!line) {
      line = word;
    } else if (line.length + 1 + word.length <= maxLen) {
      line += ` ${word}`;
    } else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);

  return lines.join("\n");
};
