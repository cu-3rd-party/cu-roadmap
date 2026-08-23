import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { normalizeStructure } from "@/entities/major";
import type { StructureSchoolDto } from "@/entities/major";

import { resetStructureMock, structureHandlers } from "../structure";

/* The handlers only ever run in the browser, but the fixture has to keep
   matching StructureSchoolDto and the real endpoints' response shapes. Driving
   them through msw/node is the cheapest way to hold that contract. */
const server = setupServer(...structureHandlers);

const BASE = "http://localhost/api/v1";

const getTree = async (): Promise<StructureSchoolDto[]> => {
  const response = await fetch(`${BASE}/majors/structure`);
  expect(response.status).toBe(200);
  return response.json();
};

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  resetStructureMock();
});
afterAll(() => server.close());

describe("structure mock", () => {
  it("serves a tree the app's normalizer accepts", async () => {
    const years = normalizeStructure(await getTree());

    expect(years.map(({ year }) => year)).toEqual([2024, 2025, 2026]);
    for (const { majors } of years) {
      expect(majors).toHaveLength(3);
      for (const major of majors) {
        expect(major.specializations.length).toBeGreaterThanOrEqual(1);
        expect(major.specializations.length).toBeLessThanOrEqual(2);
      }
    }
  });

  it("keeps the internal_name slugs the backend derives from these titles", async () => {
    const [y2024] = normalizeStructure(await getTree());

    expect(
      Object.fromEntries(y2024.majors.map(({ title, type }) => [title, type])),
    ).toEqual({
      Разработка: "swe",
      "Искусственный интеллект": "ai",
      "Бизнес и аналитика": "business",
    });
  });

  it("merges both schools into one year bucket", async () => {
    const tree = await getTree();
    expect(tree.map(({ school }) => school)).toEqual(["tech", "business"]);

    // 2 tech majors + 1 business major, flattened into a single year.
    expect(normalizeStructure(tree)[0].majors).toHaveLength(3);
  });

  it("appends a created specialization to the tree it serves", async () => {
    const target = normalizeStructure(await getTree())[0].majors[0];
    const before = target.specializations.length;

    const response = await fetch(`${BASE}/majors/specializations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        major_id: target.id,
        title: "Новая специализация",
      }),
    });

    expect(response.status).toBe(201);
    // 201 carries the whole object, like the Go handler — not just { id }.
    expect(await response.json()).toMatchObject({
      major_id: target.id,
      title: "Новая специализация",
    });

    const after = normalizeStructure(await getTree())[0].majors.find(
      ({ id }) => id === target.id,
    );
    expect(after?.specializations).toHaveLength(before + 1);
    expect(
      after?.specializations.some(
        ({ title }) => title === "Новая специализация",
      ),
    ).toBe(true);
  });

  it("rejects an unknown major id", async () => {
    const response = await fetch(`${BASE}/majors/specializations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ major_id: "nope", title: "X" }),
    });

    expect(response.status).toBe(400);
  });
});
