import { describe, expect, it } from "vitest";

import type { DisciplineGroupDto } from "../../api/dto";
import { groupRuleLabel } from "../groupRuleLabel";
import { normalizeDisciplineGroup } from "../normalizeDisciplineGroup";

const dto = (over: Partial<DisciplineGroupDto> = {}): DisciplineGroupDto => ({
  id: "g1",
  title: "Пререквизит: Введение в экономику",
  category: "prerequisite",
  root_box_id: "b1",
  math_expression: {
    type: "logical",
    logical_op: "or",
    min_count: 1,
    children: [
      { type: "course", course_id: "c1", title: "Введение в экономику" },
      { type: "course", course_id: "c2", title: "Микроэкономика" },
    ],
  },
  ...over,
});

describe("normalizeDisciplineGroup", () => {
  it("maps the DTO to the camelCase domain model", () => {
    const group = normalizeDisciplineGroup(dto());

    expect(group.id).toBe("g1");
    expect(group.category).toBe("prerequisite");
    expect(group.rootBoxId).toBe("b1");
    expect(group.expression.logicalOp).toBe("or");
    expect(group.expression.minCount).toBe(1);
    expect(group.expression.children).toHaveLength(2);
    expect(group.expression.children[0].courseId).toBe("c1");
  });

  it("tolerates an empty math_expression object", () => {
    const group = normalizeDisciplineGroup(dto({ math_expression: {} }));

    expect(group.expression.type).toBeNull();
    expect(group.expression.logicalOp).toBeNull();
    expect(group.expression.minCount).toBe(0);
    expect(group.expression.children).toEqual([]);
  });

  it("tolerates a null math_expression and null children", () => {
    expect(
      normalizeDisciplineGroup(dto({ math_expression: null })).expression
        .children,
    ).toEqual([]);

    expect(
      normalizeDisciplineGroup(
        dto({ math_expression: { type: "logical", children: null } }),
      ).expression.children,
    ).toEqual([]);
  });

  it("normalizes the operator case", () => {
    // Go emits "and"; the OpenAPI spec documents "AND".
    expect(
      normalizeDisciplineGroup(
        dto({ math_expression: { logical_op: "AND", children: [] } }),
      ).expression.logicalOp,
    ).toBe("and");
  });

  it("drops an unrecognised operator rather than passing it through", () => {
    expect(
      normalizeDisciplineGroup(
        dto({ math_expression: { logical_op: "nand", children: [] } }),
      ).expression.logicalOp,
    ).toBeNull();
  });

  it("recurses into nested children", () => {
    const group = normalizeDisciplineGroup(
      dto({
        math_expression: {
          type: "logical",
          logical_op: "and",
          children: [
            {
              type: "logical",
              logical_op: "or",
              children: [{ type: "course", course_id: "deep" }],
            },
          ],
        },
      }),
    );

    expect(group.expression.children[0].children[0].courseId).toBe("deep");
    expect(group.expression.children[0].children[0].title).toBe("");
  });
});

describe("groupRuleLabel", () => {
  it("calls an 'and' group Логика", () => {
    const group = normalizeDisciplineGroup(
      dto({
        math_expression: {
          logical_op: "and",
          min_count: 2,
          children: [{ type: "course" }, { type: "course" }],
        },
      }),
    );
    expect(groupRuleLabel(group.expression)).toBe("Логика");
  });

  it("renders a choice group as N из M", () => {
    expect(groupRuleLabel(normalizeDisciplineGroup(dto()).expression)).toBe(
      "1 из 2",
    );
  });

  it("returns null for an empty group instead of '0 из 0'", () => {
    const group = normalizeDisciplineGroup(dto({ math_expression: {} }));
    expect(groupRuleLabel(group.expression)).toBeNull();
  });
});
