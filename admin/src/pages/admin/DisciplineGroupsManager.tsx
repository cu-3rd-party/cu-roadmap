import React, { useEffect, useState } from "react";
import { api } from "@/shared/config";
import type {
  DisciplineGroup,
  DisciplineGroupInput,
} from "@/shared/config/types";
import { Button, Input, Panel } from "@/shared/ui";

export const DisciplineGroupsManager: React.FC = () => {
  const [groups, setGroups] = useState<DisciplineGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [jsonText, setJsonText] = useState(
    '{\n  "type": "logical",\n  "logical_op": "AND",\n  "required_count": 0,\n  "children": []\n}',
  );

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      setLoading(true);
      const res = await api.admin.getDisciplineGroups();
      setGroups(res.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      let mathExpr = {};
      try {
        mathExpr = JSON.parse(jsonText);
      } catch (e) {
        alert("Invalid JSON in Math Expression");
        return;
      }

      const payload: DisciplineGroupInput = {
        title,
        category,
        math_expression: mathExpr,
      };

      await api.admin.createDisciplineGroup(payload);
      setTitle("");
      setCategory("");
      setJsonText(
        '{\n  "type": "logical",\n  "logical_op": "AND",\n  "required_count": 0,\n  "children": []\n}',
      );
      loadGroups();
    } catch (err: any) {
      alert(err.response?.data?.error || err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this group?")) return;
    try {
      await api.admin.deleteDisciplineGroup(id);
      loadGroups();
    } catch (err: any) {
      alert(err.response?.data?.error || err.message);
    }
  };

  if (loading && groups.length === 0) return <div>Loading...</div>;

  return (
    <div className="flex flex-col gap-6">
      {error && <div className="text-red-500 font-bold">{error}</div>}

      <Panel className="p-6">
        <h2 className="text-xl font-bold mb-4">
          Создать Коробку (Discipline Group)
        </h2>
        <div className="flex flex-col gap-4">
          <Input
            placeholder="Название (например: Матан 1)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Input
            placeholder="Категория (например: fund, core, choice)"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
          <div>
            <label className="block text-sm font-medium mb-1">
              Math Expression (JSON)
            </label>
            <textarea
              className="w-full h-48 p-2 border rounded font-mono text-sm dark:bg-zinc-900"
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
            />
          </div>
          <Button onClick={handleCreate}>Создать Коробку</Button>
        </div>
      </Panel>

      <Panel className="p-6">
        <h2 className="text-xl font-bold mb-4">Список Коробок</h2>
        <div className="flex flex-col gap-4">
          {groups.length === 0 ? (
            <p>Нет созданных коробок.</p>
          ) : (
            groups.map((g) => (
              <div key={g.id} className="p-4 border rounded relative group">
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute top-4 right-4 text-red-500 border-red-500 hover:bg-red-500 hover:text-white"
                  onClick={() => handleDelete(g.id)}
                >
                  Удалить
                </Button>
                <div className="font-bold text-lg mb-1">{g.title}</div>
                <div className="text-sm text-gray-500 mb-2">
                  Category: {g.category}
                </div>
                <div className="text-sm text-gray-500 mb-2">
                  Root Box ID: {g.root_box_id}
                </div>
                <pre className="text-xs bg-gray-100 dark:bg-zinc-800 p-2 rounded overflow-auto max-h-40">
                  {JSON.stringify(g.math_expression, null, 2)}
                </pre>
              </div>
            ))
          )}
        </div>
      </Panel>
    </div>
  );
};
