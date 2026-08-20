import { useEffect, useState } from "react";
import {
  Package,
  Plus,
  RefreshCw,
  Trash2,
  Edit3,
  Search,
  Check,
  AlertCircle,
  Layers,
  FileJson,
  X,
  Code,
} from "lucide-react";
import { apiClient } from "@/shared/api";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Badge,
} from "@/shared/ui";

interface CourseOption {
  id: string;
  title: string;
}

interface DisciplineGroup {
  id: string;
  title: string;
  category: string;
  math_expression: any;
  root_box_id: string;
}

const PRESETS = [
  {
    name: "Один курс (Single Course)",
    template: (courseId: string, courseTitle: string) => ({
      type: "logical",
      logical_op: "and",
      min_count: 1,
      children: [
        {
          type: "course",
          course_id: courseId || "00000000-0000-0000-0000-000000000000",
          title: courseTitle || "Название курса",
        },
      ],
    }),
  },
  {
    name: "Альтернативный выбор (Logical OR - 1 из N)",
    template: (courseId: string, courseTitle: string) => ({
      type: "logical",
      logical_op: "or",
      min_count: 1,
      children: [
        {
          type: "course",
          course_id: courseId || "00000000-0000-0000-0000-000000000000",
          title: courseTitle || "Курс 1",
        },
        {
          type: "course",
          course_id: "11111111-1111-1111-1111-111111111111",
          title: "Курс 2",
        },
      ],
    }),
  },
  {
    name: "Обязательный набор (Logical AND)",
    template: (courseId: string, courseTitle: string) => ({
      type: "logical",
      logical_op: "and",
      min_count: 2,
      children: [
        {
          type: "course",
          course_id: courseId || "00000000-0000-0000-0000-000000000000",
          title: courseTitle || "Курс 1",
        },
        {
          type: "course",
          course_id: "11111111-1111-1111-1111-111111111111",
          title: "Курс 2",
        },
      ],
    }),
  },
];

const RenderBoxNode = ({ node }: { node: any }) => {
  if (!node) return <div className="text-xs text-fg-secondary italic">Пустой узел</div>;

  if (node.type === "course") {
    return (
      <div className="flex items-center gap-2 p-2 rounded bg-surface-alt border border-border text-sm">
        <Package className="w-4 h-4 text-accent" />
        <span className="font-medium text-fg-primary">{node.title || "Курс"}</span>
        {node.course_id && (
          <span className="text-xs font-mono text-fg-secondary">({node.course_id.slice(0, 8)}...)</span>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-3 rounded-lg bg-surface border border-border/80">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent">
        <Layers className="w-3.5 h-3.5" />
        <span>Логическая Коробка ({node.logical_op || "and"})</span>
        {node.min_count !== undefined && (
          <Badge variant="outline" className="text-[10px] py-0">
            Мин. {node.min_count}
          </Badge>
        )}
      </div>
      {node.children && node.children.length > 0 ? (
        <div className="pl-4 border-l-2 border-accent/30 flex flex-col gap-2 mt-1">
          {node.children.map((child: any, idx: number) => (
            <RenderBoxNode key={idx} node={child} />
          ))}
        </div>
      ) : (
        <span className="text-xs text-fg-secondary italic pl-2">Без дочерних элементов</span>
      )}
    </div>
  );
};

export default function BoxesPage() {
  const [groups, setGroups] = useState<DisciplineGroup[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Form / Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<DisciplineGroup | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formCategory, setFormCategory] = useState("prerequisite");
  const [formMathExpr, setFormMathExpr] = useState("{}");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // View Raw JSON state
  const [viewJsonGroup, setViewJsonGroup] = useState<DisciplineGroup | null>(null);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<DisciplineGroup[]>("/discipline-groups");
      setGroups(res.data || []);
    } catch (err: any) {
      setStatusMsg("Ошибка при загрузке коробок: " + (err.message || String(err)));
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const res = await apiClient.get("/courses");
      if (Array.isArray(res.data)) {
        setCourses(res.data.map((c: any) => ({ id: c.id, title: c.title })));
      }
    } catch {
      // optional course picker fallback
    }
  };

  useEffect(() => {
    fetchGroups();
    fetchCourses();
  }, []);

  const handleSync = async () => {
    try {
      setSyncing(true);
      setStatusMsg("Запущена синхронизация с Google Таблицами...");
      await apiClient.post("/admin/sync");
      setStatusMsg("Синхронизация успешно выполнена!");
      await fetchGroups();
    } catch (err: any) {
      setStatusMsg("Ошибка при синхронизации: " + (err.message || String(err)));
    } finally {
      setSyncing(false);
    }
  };

  const openCreateForm = () => {
    setEditingGroup(null);
    setFormTitle("");
    setFormCategory("prerequisite");
    const defaultTemplate = PRESETS[0].template("", "");
    setFormMathExpr(JSON.stringify(defaultTemplate, null, 2));
    setJsonError(null);
    setIsFormOpen(true);
  };

  const openEditForm = (group: DisciplineGroup) => {
    setEditingGroup(group);
    setFormTitle(group.title);
    setFormCategory(group.category || "prerequisite");
    setFormMathExpr(JSON.stringify(group.math_expression, null, 2));
    setJsonError(null);
    setIsFormOpen(true);
  };

  const handleApplyPreset = (presetIdx: number) => {
    const selectedCourse = courses.find((c) => c.id === selectedCourseId);
    const template = PRESETS[presetIdx].template(
      selectedCourseId,
      selectedCourse ? selectedCourse.title : "Выбранный курс"
    );
    setFormMathExpr(JSON.stringify(template, null, 2));
    setJsonError(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    let parsedExpr: any;
    try {
      parsedExpr = JSON.parse(formMathExpr);
    } catch (err: any) {
      setJsonError("Невалидный JSON: " + err.message);
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        title: formTitle,
        category: formCategory,
        math_expression: parsedExpr,
      };

      if (editingGroup) {
        await apiClient.put(`/discipline-groups/${editingGroup.id}`, payload);
        setStatusMsg(`Коробка "${formTitle}" обновлена`);
      } else {
        await apiClient.post("/discipline-groups", payload);
        setStatusMsg(`Коробка "${formTitle}" создана`);
      }

      setIsFormOpen(false);
      fetchGroups();
    } catch (err: any) {
      setJsonError("Ошибка сохранения: " + (err.response?.data?.error || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Удалить коробку дисциплин "${title}"?`)) return;
    try {
      await apiClient.delete(`/discipline-groups/${id}`);
      setStatusMsg(`Коробка "${title}" удалена`);
      fetchGroups();
    } catch (err: any) {
      setStatusMsg("Ошибка удаления: " + (err.message || String(err)));
    }
  };

  // Categories list for filter tabs
  const categories = Array.from(new Set(groups.map((g) => g.category || "без категории")));

  const filteredGroups = groups.filter((g) => {
    const matchesSearch =
      g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || (g.category || "без категории") === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col gap-6 text-fg-primary">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 rounded-2xl bg-surface border border-border shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="bg-accent/10 text-accent border-accent/30 font-semibold px-2.5 py-1">
              ВРЕМЕННАЯ ТЕСТОВАЯ АДМИНКА
            </Badge>
            <span className="text-xs text-fg-secondary">Только для отладки бэкенда</span>
          </div>
          <h1 className="text-2xl font-bold mt-2">Управление Коробками Дисциплин (Discipline Group Boxes)</h1>
          <p className="text-sm text-fg-secondary mt-1">
            Просмотр, создание и редактирование стандартизированных коробок пререквизитов, кореквизитов и требований.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin text-accent" : ""}`} />
            {syncing ? "Синхронизация..." : "Sync с Google Sheets"}
          </Button>

          <Button onClick={openCreateForm} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Создать Коробку
          </Button>
        </div>
      </div>

      {statusMsg && (
        <div className="flex items-center justify-between p-4 rounded-xl bg-accent/10 border border-accent/30 text-sm text-accent">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>{statusMsg}</span>
          </div>
          <button onClick={() => setStatusMsg(null)} className="text-fg-secondary hover:text-fg-primary">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-fg-secondary" />
          <Input
            placeholder="Поиск по названию или ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              selectedCategory === "all"
                ? "bg-accent text-accent-contrast font-semibold"
                : "bg-surface hover:bg-surface-alt border border-border text-fg-secondary"
            }`}
          >
            Все ({groups.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                selectedCategory === cat
                  ? "bg-accent text-accent-contrast font-semibold"
                  : "bg-surface hover:bg-surface-alt border border-border text-fg-secondary"
              }`}
            >
              {cat} ({groups.filter((g) => (g.category || "без категории") === cat).length})
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Discipline Groups */}
      {loading ? (
        <div className="p-12 text-center text-fg-secondary flex flex-col items-center gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-accent" />
          <span>Загрузка коробок...</span>
        </div>
      ) : filteredGroups.length === 0 ? (
        <Card className="p-12 text-center text-fg-secondary">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-40 text-accent" />
          <p className="font-semibold text-lg">Коробки не найдены</p>
          <p className="text-sm mt-1">Нажмите "Sync с Google Sheets" или создайте новую коробку вручную.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGroups.map((group) => (
            <Card key={group.id} className="flex flex-col justify-between hover:border-accent/50 transition-all">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <Badge
                    className={
                      group.category === "prerequisite"
                        ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                        : group.category === "corequisite"
                        ? "bg-purple-500/20 text-purple-400 border-purple-500/30"
                        : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                    }
                  >
                    {group.category || "без категории"}
                  </Badge>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setViewJsonGroup(group)}
                      title="Просмотреть Raw JSON"
                    >
                      <Code className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditForm(group)}
                      title="Редактировать"
                    >
                      <Edit3 className="w-4 h-4 text-accent" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(group.id, group.title)}
                      title="Удалить"
                    >
                      <Trash2 className="w-4 h-4 text-negative" />
                    </Button>
                  </div>
                </div>

                <CardTitle className="text-base font-bold line-clamp-2 mt-2">{group.title}</CardTitle>
                <CardDescription className="text-xs font-mono text-fg-secondary">
                  ID: {group.id}
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-0 flex flex-col gap-3">
                <div className="text-xs text-fg-secondary font-medium">Дерево требований (Box Tree):</div>
                <div className="max-h-56 overflow-y-auto pr-1">
                  <RenderBoxNode node={group.math_expression} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal / Form for Creating/Editing */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl p-6 w-full max-w-2xl shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h2 className="text-lg font-bold">
                {editingGroup ? "Редактирование Коробки" : "Создание Новой Коробки Дисциплин"}
              </h2>
              <button
                onClick={() => setIsFormOpen(false)}
                className="text-fg-secondary hover:text-fg-primary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="form-title">Название Коробки</Label>
                <Input
                  id="form-title"
                  placeholder="Например: Пререквизиты для Алгоритмов"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="form-category">Категория</Label>
                <select
                  id="form-category"
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full bg-surface-alt border border-border rounded-lg p-2.5 text-sm text-fg-primary"
                >
                  <option value="prerequisite">prerequisite (Пререквизит)</option>
                  <option value="corequisite">corequisite (Кореквизит)</option>
                  <option value="major">major (Мажорное требование)</option>
                  <option value="specialization">specialization (Требование специализации)</option>
                  <option value="custom">custom (Другое)</option>
                </select>
              </div>

              {/* Course Selector Helper */}
              {courses.length > 0 && (
                <div className="p-3 rounded-lg bg-surface-alt border border-border flex flex-col gap-2">
                  <Label className="text-xs text-accent">Выбор курса для подстановки в пресет:</Label>
                  <select
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                    className="w-full bg-surface border border-border rounded p-2 text-xs text-fg-primary"
                  >
                    <option value="">-- Выберите курс из базы данных --</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title} ({c.id.slice(0, 8)}...)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Presets buttons */}
              <div className="flex flex-col gap-2">
                <Label className="text-xs text-fg-secondary">Шаблоны / Пресеты Math Expression:</Label>
                <div className="flex flex-wrap gap-2">
                  {PRESETS.map((p, idx) => (
                    <Button
                      key={idx}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleApplyPreset(idx)}
                      className="text-xs"
                    >
                      {p.name}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Math Expression Editor */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="form-json">Math Expression (JSON Дерево Коробок)</Label>
                <textarea
                  id="form-json"
                  rows={8}
                  value={formMathExpr}
                  onChange={(e) => {
                    setFormMathExpr(e.target.value);
                    setJsonError(null);
                  }}
                  className="w-full font-mono text-xs p-3 rounded-lg bg-surface-alt border border-border text-fg-primary focus:outline-none focus:border-accent"
                />
              </div>

              {jsonError && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-negative/10 border border-negative/30 text-xs text-negative">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{jsonError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsFormOpen(false)}
                >
                  Отмена
                </Button>
                <Button type="submit" loading={submitting}>
                  Сохранить Коробку
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Raw JSON View Modal */}
      {viewJsonGroup && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl p-6 w-full max-w-xl shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <FileJson className="w-5 h-5 text-accent" />
                <h3 className="font-bold text-base">{viewJsonGroup.title}</h3>
              </div>
              <button
                onClick={() => setViewJsonGroup(null)}
                className="text-fg-secondary hover:text-fg-primary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <pre className="bg-surface-alt p-4 rounded-xl text-xs font-mono max-h-96 overflow-y-auto text-fg-primary border border-border">
              {JSON.stringify(viewJsonGroup, null, 2)}
            </pre>

            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setViewJsonGroup(null)}>
                Закрыть
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
