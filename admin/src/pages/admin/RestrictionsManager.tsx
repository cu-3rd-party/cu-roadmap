import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, X, Save } from "lucide-react";

import { api } from "@/shared/config";
import type { CourseRestriction, CourseRestrictionInput, Specialization } from "@/shared/config/types";
import { Button } from "@/shared/ui/kit/button";

const CATEGORIES = [
  { value: "fundamentals", label: "Fundamentals" },
  { value: "ai", label: "AI" },
  { value: "stem", label: "STEM" },
  { value: "soft", label: "Soft Skills" },
  { value: "business", label: "Business" },
  { value: "tech", label: "Tech" },
  { value: "swe", label: "Software Engineering" },
  { value: "design", label: "Design" },
];

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

interface RestrictionsManagerProps {
  specialization: Specialization;
  onBack: () => void;
}

export function RestrictionsManager({ specialization, onBack }: RestrictionsManagerProps) {
  const [restrictions, setRestrictions] = useState<CourseRestriction[]>([]);
  const [editingRestriction, setEditingRestriction] = useState<CourseRestriction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadRestrictions();
  }, [specialization.id]);

  const loadRestrictions = async () => {
    try {
      setLoading(true);
      const res = await api.admin.getRestrictions(specialization.id);
      setRestrictions(res.data || []);
    } catch (e: unknown) {
      const err = e as { response?: { status: number }; message?: string };
      setError(err.message ?? "Failed to load restrictions");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (restriction: CourseRestrictionInput) => {
    try {
      if (editingRestriction?.id) {
        await api.admin.updateRestriction(editingRestriction.id, restriction);
      } else {
        await api.admin.createRestriction(specialization.id, restriction);
      }
      await loadRestrictions();
      setEditingRestriction(null);
    } catch (e: unknown) {
      const err = e as { response?: { status: number }; message?: string };
      alert(err.message ?? "Failed to save restriction");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Вы уверены, что хотите удалить это ограничение?")) return;
    try {
      await api.admin.deleteRestriction(id);
      await loadRestrictions();
    } catch (e: unknown) {
      const err = e as { response?: { status: number }; message?: string };
      alert(err.message ?? "Failed to delete restriction");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Загрузка...</div>
      </div>
    );
  }

  if (editingRestriction) {
    return (
      <RestrictionEditor
        restriction={editingRestriction}
        onSave={handleSave}
        onCancel={() => setEditingRestriction(null)}
      />
    );
  }

  return (
    <div
      className="h-screen overflow-y-auto p-6"
      style={{
        backgroundColor: "var(--color-bg-main)",
        color: "var(--color-text-main)",
      }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 rounded-md hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer text-gray-500"
            >
              <X size={20} />
            </button>
            <div>
              <h1 className="text-xl font-bold">Ограничения: {specialization.title}</h1>
              <p className="text-sm text-gray-500">
                Настройка мин/макс количества курсов по категориям в каждом семестре
              </p>
            </div>
          </div>
          <button
            onClick={() =>
              setEditingRestriction({
                id: "",
                specialization_id: specialization.id,
                semester: 1,
                category: "stem",
                min_courses: 0,
                max_courses: 999,
                internal_description: "",
              })
            }
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium cursor-pointer"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            <Plus size={18} /> Добавить ограничение
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500 text-red-500">
            {error}
          </div>
        )}

        {restrictions.length === 0 ? (
          <div
            className="p-8 rounded-xl border text-center text-gray-500"
            style={{ borderColor: "var(--color-border)" }}
          >
            Нет ограничений. Добавьте первое ограничение, чтобы начать.
          </div>
        ) : (
          <div
            className="rounded-xl border overflow-hidden"
            style={{ borderColor: "var(--color-border)" }}
          >
            <table className="w-full text-left border-collapse">
              <thead>
                <tr
                  className="border-b"
                  style={{
                    borderColor: "var(--color-border)",
                    backgroundColor: "var(--color-bg-card)",
                  }}
                >
                  <th className="p-4 font-semibold">Семестр</th>
                  <th className="p-4 font-semibold">Категория</th>
                  <th className="p-4 font-semibold">Мин</th>
                  <th className="p-4 font-semibold">Макс</th>
                  <th className="p-4 font-semibold">Описание</th>
                  <th className="p-4 font-semibold w-16">Действия</th>
                </tr>
              </thead>
              <tbody>
                {restrictions
                  .sort((a, b) => a.semester - b.semester || a.category.localeCompare(b.category))
                  .map((r) => (
                    <tr
                      key={r.id}
                      className="border-b last:border-0 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                      style={{ borderColor: "var(--color-border)" }}
                    >
                      <td className="p-4">{r.semester}</td>
                      <td className="p-4">
                        <span
                          className="px-2 py-0.5 rounded text-xs font-medium"
                          style={{
                            backgroundColor: "var(--color-primary)",
                            color: "#000",
                            opacity: 0.85,
                          }}
                        >
                          {r.category}
                        </span>
                      </td>
                      <td className="p-4">{r.min_courses}</td>
                      <td className="p-4">{r.max_courses}</td>
                      <td className="p-4 text-gray-500 text-sm">
                        {r.internal_description || "—"}
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingRestriction(r)}
                            className="p-2 rounded-md hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer text-gray-500"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(r.id)}
                            className="p-2 rounded-md hover:bg-red-500/10 dark:hover:bg-red-500/20 transition-colors cursor-pointer text-red-500"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

interface RestrictionEditorProps {
  restriction: CourseRestriction;
  onSave: (r: CourseRestrictionInput) => void;
  onCancel: () => void;
}

function RestrictionEditor({ restriction, onSave, onCancel }: RestrictionEditorProps) {
  const [formData, setFormData] = useState<CourseRestrictionInput>({
    semester: restriction.semester,
    category: restriction.category,
    min_courses: restriction.min_courses,
    max_courses: restriction.max_courses,
    internal_description: restriction.internal_description || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div
      className="max-w-2xl mx-auto w-full p-6 rounded-2xl border"
      style={{
        backgroundColor: "var(--color-bg-card)",
        borderColor: "var(--color-border)",
      }}
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">
          {restriction.id ? "Редактировать ограничение" : "Новое ограничение"}
        </h2>
        <button
          onClick={onCancel}
          className="p-2 rounded-md hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer text-gray-500"
        >
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-400">
            Семестр
            <select
              required
              name="semester"
              value={formData.semester}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, semester: parseInt(e.target.value) }))
              }
              className="px-3 py-2 rounded-lg border bg-transparent text-base"
              style={{
                borderColor: "var(--color-border)",
                color: "var(--color-text-main)",
              }}
            >
              {SEMESTERS.map((s) => (
                <option key={s} value={s}>
                  {s} семестр
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-400">
            Категория курсов
            <select
              required
              name="category"
              value={formData.category}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, category: e.target.value }))
              }
              className="px-3 py-2 rounded-lg border bg-transparent text-base"
              style={{
                borderColor: "var(--color-border)",
                color: "var(--color-text-main)",
              }}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-400">
            Минимум курсов
            <input
              type="number"
              min="0"
              max="20"
              name="min_courses"
              value={formData.min_courses}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, min_courses: parseInt(e.target.value) || 0 }))
              }
              className="px-3 py-2 rounded-lg border bg-transparent text-base"
              style={{
                borderColor: "var(--color-border)",
                color: "var(--color-text-main)",
              }}
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-400">
            Максимум курсов
            <input
              type="number"
              min="0"
              max="20"
              name="max_courses"
              value={formData.max_courses}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, max_courses: parseInt(e.target.value) || 999 }))
              }
              className="px-3 py-2 rounded-lg border bg-transparent text-base"
              style={{
                borderColor: "var(--color-border)",
                color: "var(--color-text-main)",
              }}
            />
          </label>
        </div>

        <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-400">
          Внутреннее описание (для администраторов)
          <textarea
            name="internal_description"
            value={formData.internal_description}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, internal_description: e.target.value }))
            }
            rows={3}
            className="px-3 py-2 rounded-lg border bg-transparent text-base resize-none"
            style={{
              borderColor: "var(--color-border)",
              color: "var(--color-text-main)",
            }}
            placeholder="Например: 'Студенты должны взять хотя бы один STEM-курс в первом семестре'"
          />
        </label>

        <div className="flex gap-3 mt-4">
          <Button type="submit" className="flex items-center gap-2">
            <Save size={18} />
            Сохранить
          </Button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-gray-600 text-gray-400 hover:bg-gray-800 cursor-pointer"
          >
            Отмена
          </button>
        </div>
      </form>
    </div>
  );
}
