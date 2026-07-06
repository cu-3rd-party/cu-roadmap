import { describe, expect, it } from "vitest";

import { pluralizeRu } from "../plural";

const forms: [string, string, string] = ["лекция", "лекции", "лекций"];

describe("pluralizeRu", () => {
  it("uses the 'one' form for 1, 21, 31", () => {
    expect(pluralizeRu(1, forms)).toBe("лекция");
    expect(pluralizeRu(21, forms)).toBe("лекция");
    expect(pluralizeRu(31, forms)).toBe("лекция");
  });

  it("uses the 'few' form for 2-4, 22-24", () => {
    expect(pluralizeRu(2, forms)).toBe("лекции");
    expect(pluralizeRu(3, forms)).toBe("лекции");
    expect(pluralizeRu(4, forms)).toBe("лекции");
    expect(pluralizeRu(23, forms)).toBe("лекции");
  });

  it("uses the 'many' form for 0, 5-20, and the 11-14 teens", () => {
    expect(pluralizeRu(0, forms)).toBe("лекций");
    expect(pluralizeRu(5, forms)).toBe("лекций");
    expect(pluralizeRu(11, forms)).toBe("лекций");
    expect(pluralizeRu(12, forms)).toBe("лекций");
    expect(pluralizeRu(14, forms)).toBe("лекций");
    expect(pluralizeRu(20, forms)).toBe("лекций");
  });
});
