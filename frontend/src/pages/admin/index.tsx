import { useState, type FormEvent, type ChangeEvent, useEffect } from "react";
import {
  Plus,
  Edit,
  Save,
  X,
  Trash2,
  Lock,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { Button } from "@/shared/ui/kit/button";
import { api } from "@/shared/config";
import type { Course } from "@/shared/config";

interface Major {
  id: string;
  title: string;
  school?: string;
  cohort_year?: number;
  requirements?: { course_id: string; type: string }[];
}

export function AdminPage({ onBack }: { onBack: () => void }) {
  const [authState, setAuthState] = useState<
    "loading" | "login" | "authenticated"
  >("loading");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [majors, setMajors] = useState<Major[]>([]);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [editingMajor, setEditingMajor] = useState<Major | null>(null);
  const [activeTab, setActiveTab] = useState<"courses" | "majors">("courses");
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .authCheck()
      .then(() => {
        setAuthState("authenticated");
        fetchData();
      })
      .catch(() => setAuthState("login"))
      .finally(() => setDataLoading(false));
  }, []);

  const fetchData = async () => {
    try {
      const [coursesRes, majorsRes] = await Promise.all([
        api.admin.getCourses(),
        api.admin.getMajors(),
      ]);
      setCourses(coursesRes.data);
      setMajors(majorsRes.data);
    } catch (e: any) {
      if (e.response?.status === 401) {
        setAuthState("login");
        setError("Сессия истекла, войдите снова");
        return;
      }
      setError(e.message);
    }
  };

  useEffect(() => {
    if (authState === "authenticated") {
      fetchData().finally(() => setDataLoading(false));
    }
  }, [authState]);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError("");
    try {
      await api.login(password);
      setAuthState("authenticated");
      setDataLoading(true);
      await fetchData();
    } catch (e: any) {
      if (e.response?.status === 401) {
        setLoginError("Неверный пароль");
      } else if (e.response?.status === 503) {
        setLoginError("Сервер недоступен");
      } else {
        setLoginError(e.message);
      }
    }
    setLoginLoading(false);
  };

  const handleSave = async (course: Course) => {
    try {
      if (course.id) {
        await api.admin.updateCourse(course.id, course);
      } else {
        await api.admin.createCourse(course);
      }
      await fetchData();
      setEditingCourse(null);
    } catch (e: any) {
      if (e.response?.status === 401) {
        setAuthState("login");
        setError("Сессия истекла, войдите снова");
        return;
      }
      alert(e.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Вы уверены, что хотите удалить этот курс?")) return;
    try {
      await api.admin.deleteCourse(id);
      await fetchData();
    } catch (e: any) {
      if (e.response?.status === 401) {
        setAuthState("login");
        setError("Сессия истекла, войдите снова");
        return;
      }
      alert(e.message);
    }
  };

  const handleSaveMajor = async (major: Major) => {
    try {
      const payload = {
        title: major.title,
        school: major.school,
        cohort_year: major.cohort_year,
        requirements: major.requirements || [],
      };
      if (major.id) {
        await api.admin.updateMajor(major.id, payload);
      } else {
        await api.admin.createMajor(payload);
      }
      await fetchData();
      setEditingMajor(null);
    } catch (e: any) {
      if (e.response?.status === 401) {
        setAuthState("login");
        setError("Сессия истекла, войдите снова");
        return;
      }
      alert(e.message);
    }
  };

  if (authState === "loading") {
    return (
      <div
        className="flex items-center justify-center h-screen"
        style={{
          backgroundColor: "var(--color-bg-main)",
          color: "var(--color-text-muted)",
        }}
      >
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  if (authState === "login") {
    return (
      <div
        className="flex flex-col items-center justify-center h-screen"
        style={{ backgroundColor: "var(--color-bg-main)" }}
      >
        <div
          className="p-8 rounded-2xl border"
          style={{
            backgroundColor: "var(--color-bg-card)",
            borderColor: "var(--color-border)",
          }}
        >
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm mb-6 cursor-pointer bg-transparent border-none"
            style={{ color: "var(--color-text-muted)" }}
          >
            <ArrowLeft size={16} /> На главную
          </button>
          <div
            className="flex items-center gap-3 mb-6 text-xl font-bold"
            style={{ color: "var(--color-text-main)" }}
          >
            <Lock /> Админ панель
          </div>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <input
              type="password"
              placeholder="Пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="px-4 py-2 rounded-md border bg-transparent"
              style={{
                borderColor: "var(--color-border)",
                color: "var(--color-text-main)",
              }}
            />
            {(loginError || error) && (
              <div className="text-red-500 text-sm">{loginError || error}</div>
            )}
            <Button disabled={loginLoading}>Войти</Button>
          </form>
        </div>
      </div>
    );
  }

  if (editingCourse) {
    return (
      <div
        className="h-screen overflow-y-auto p-6"
        style={{
          backgroundColor: "var(--color-bg-main)",
          color: "var(--color-text-main)",
        }}
      >
        <CourseEditor
          course={editingCourse}
          allCourses={courses}
          onSave={handleSave}
          onCancel={() => setEditingCourse(null)}
        />
      </div>
    );
  }

  if (editingMajor) {
    return (
      <div
        className="h-screen overflow-y-auto p-6"
        style={{
          backgroundColor: "var(--color-bg-main)",
          color: "var(--color-text-main)",
        }}
      >
        <MajorEditor
          major={editingMajor}
          allCourses={courses}
          onSave={handleSaveMajor}
          onCancel={() => setEditingMajor(null)}
        />
      </div>
    );
  }

  return (
    <div
      className="flex flex-col h-screen overflow-y-auto p-10"
      style={{
        backgroundColor: "var(--color-bg-main)",
        color: "var(--color-text-main)",
      }}
    >
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-4 border-b border-gray-700 w-full mb-4">
          <button
            onClick={() => setActiveTab("courses")}
            className={`py-2 px-4 font-semibold border-b-2 transition-colors ${activeTab === "courses" ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-300"}`}
            style={{
              borderColor:
                activeTab === "courses"
                  ? "var(--color-primary)"
                  : "transparent",
              color: activeTab === "courses" ? "var(--color-primary)" : "",
            }}
          >
            Курсы
          </button>
          <button
            onClick={() => setActiveTab("majors")}
            className={`py-2 px-4 font-semibold border-b-2 transition-colors ${activeTab === "majors" ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-300"}`}
            style={{
              borderColor:
                activeTab === "majors" ? "var(--color-primary)" : "transparent",
              color: activeTab === "majors" ? "var(--color-primary)" : "",
            }}
          >
            Направления (Мейджоры)
          </button>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">
          {activeTab === "courses"
            ? "Управление курсами"
            : "Управление направлениями"}
        </h1>
        {activeTab === "courses" ? (
          <button
            onClick={() =>
              setEditingCourse({
                id: "",
                title: "",
                description: "",
                workload: 3,
                available_semesters: [],
                allowed_cohorts: [],
                recommended_semester: null,
                prerequisites: [],
                corequisites: [],
                handbook_link: "",
              })
            }
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium cursor-pointer"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            <Plus size={18} /> Добавить курс
          </button>
        ) : (
          <button
            onClick={() =>
              setEditingMajor({
                id: "",
                title: "",
                school: "",
                cohort_year: 2025,
                requirements: [],
              })
            }
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium cursor-pointer"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            <Plus size={18} /> Добавить направление
          </button>
        )}
      </div>

      <div
        className="flex-1 overflow-auto rounded-xl border"
        style={{ borderColor: "var(--color-border)" }}
      >
        {activeTab === "courses" ? (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr
                className="border-b"
                style={{
                  borderColor: "var(--color-border)",
                  backgroundColor: "var(--color-bg-card)",
                }}
              >
                <th className="p-4 font-semibold">Название</th>
                <th className="p-4 font-semibold">Категория</th>
                <th className="p-4 font-semibold">Потоки</th>
                <th className="p-4 font-semibold">Нагрузка</th>
                <th className="p-4 font-semibold w-16">Действия</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((c) => (
                <tr
                  key={c.id}
                  className="border-b last:border-0 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  style={{ borderColor: "var(--color-border)" }}
                >
                  <td className="p-4">{c.title}</td>
                  <td className="p-4">
                    <span
                      className="px-2 py-0.5 rounded text-xs font-medium"
                      style={{
                        backgroundColor: "var(--color-primary)",
                        color: "#000",
                        opacity: 0.85,
                      }}
                    >
                      {c.category}
                    </span>
                  </td>
                  <td className="p-4">
                    {c.allowed_cohorts?.join(", ") || "—"}
                  </td>
                  <td className="p-4">{c.workload} з.е.</td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingCourse(c)}
                        className="p-2 rounded-md hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer text-gray-500"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
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
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr
                className="border-b"
                style={{
                  borderColor: "var(--color-border)",
                  backgroundColor: "var(--color-bg-card)",
                }}
              >
                <th className="p-4 font-semibold">Название</th>
                <th className="p-4 font-semibold">Школа / Факультет</th>
                <th className="p-4 font-semibold">Год</th>
                <th className="p-4 font-semibold">major core</th>
                <th className="p-4 font-semibold">major choice</th>
                <th className="p-4 font-semibold">flex</th>
                <th className="p-4 font-semibold">общеуниверситетский</th>
                <th className="p-4 font-semibold">факультатив</th>
                <th className="p-4 font-semibold">Minor</th>
                <th className="p-4 font-semibold">soft</th>
                <th className="p-4 font-semibold">selected topics</th>
                <th className="p-4 font-semibold w-16">Действия</th>
              </tr>
            </thead>
            <tbody>
              {majors.map((m) => (
                <tr
                  key={m.id}
                  className="border-b last:border-0 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  style={{ borderColor: "var(--color-border)" }}
                >
                  <td className="p-4">{m.title}</td>
                  <td className="p-4">{m.school}</td>
                  <td className="p-4">{m.cohort_year || "-"}</td>
                  <td className="p-4">
                    {m.requirements?.filter((r) => r.type === "major_core")
                      .length || 0}
                  </td>
                  <td className="p-4">
                    {m.requirements?.filter((r) => r.type === "major_choice")
                      .length || 0}
                  </td>
                  <td className="p-4">
                    {m.requirements?.filter((r) => r.type === "flex").length ||
                      0}
                  </td>
                  <td className="p-4">
                    {m.requirements?.filter((r) => r.type === "university")
                      .length || 0}
                  </td>
                  <td className="p-4">
                    {m.requirements?.filter((r) => r.type === "elective")
                      .length || 0}
                  </td>
                  <td className="p-4">
                    {m.requirements?.filter((r) => r.type === "minor").length ||
                      0}
                  </td>
                  <td className="p-4">
                    {m.requirements?.filter((r) => r.type === "soft").length ||
                      0}
                  </td>
                  <td className="p-4">
                    {m.requirements?.filter((r) => r.type === "selected_topics")
                      .length || 0}
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingMajor(m)}
                        className="p-2 rounded-md hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer text-gray-500"
                      >
                        <Edit size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function CourseEditor({
  course,
  allCourses,
  onSave,
  onCancel,
}: {
  course: Course;
  allCourses: Course[];
  onSave: (c: Course) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState(course);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "workload" ? parseFloat(value) || 0 : value,
    }));
  };

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
          {course.id ? "Редактировать курс" : "Новый курс"}
        </h2>
        <button
          onClick={onCancel}
          className="p-2 rounded-md hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer text-gray-500"
        >
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-400">
          Название
          <input
            required
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="px-3 py-2 rounded-lg border bg-transparent text-base"
            style={{
              borderColor: "var(--color-border)",
              color: "var(--color-text-main)",
            }}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-400">
          Описание
          <textarea
            name="description"
            value={formData.description || ""}
            onChange={handleChange}
            className="px-3 py-2 rounded-lg border bg-transparent text-base min-h-[100px]"
            style={{
              borderColor: "var(--color-border)",
              color: "var(--color-text-main)",
            }}
          />
        </label>
        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-400">
            Тип
            <select
              name="course_type"
              value={formData.course_type}
              onChange={handleChange}
              className="px-3 py-2 rounded-lg border bg-transparent text-base"
              style={{
                borderColor: "var(--color-border)",
                color: "var(--color-text-main)",
              }}
            >
              <option value="mandatory" className="bg-black text-white">
                Обязательный (mandatory)
              </option>
              <option value="elective" className="bg-black text-white">
                По выбору (elective)
              </option>
              <option value="other" className="bg-black text-white">
                Другое (other)
              </option>
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-400">
            Категория
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="px-3 py-2 rounded-lg border bg-transparent text-base"
              style={{
                borderColor: "var(--color-border)",
                color: "var(--color-text-main)",
              }}
            >
              <option value="stem" className="bg-black text-white">
                STEM
              </option>
              <option value="soft" className="bg-black text-white">
                Soft
              </option>
              <option value="business" className="bg-black text-white">
                Business
              </option>
              <option value="tech" className="bg-black text-white">
                Tech
              </option>
              <option value="ai" className="bg-black text-white">
                AI
              </option>
              <option value="design" className="bg-black text-white">
                Design
              </option>
            </select>
          </label>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-400">
            Нагрузка (з.е.)
            <input
              type="number"
              step="0.5"
              name="workload"
              value={formData.workload}
              onChange={handleChange}
              className="px-3 py-2 rounded-lg border bg-transparent text-base"
              style={{
                borderColor: "var(--color-border)",
                color: "var(--color-text-main)",
              }}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-400">
            Рекомендованный семестр
            <input
              type="number"
              min="1"
              max="8"
              name="recommended_semester"
              value={formData.recommended_semester || ""}
              onChange={(e) =>
                setFormData((p) => ({
                  ...p,
                  recommended_semester: e.target.value
                    ? parseInt(e.target.value)
                    : null,
                }))
              }
              className="px-3 py-2 rounded-lg border bg-transparent text-base"
              style={{
                borderColor: "var(--color-border)",
                color: "var(--color-text-main)",
              }}
              placeholder="Любой"
            />
          </label>
        </div>

        <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-400">
          Силлабус (Ссылка)
          <input
            type="text"
            name="handbook_link"
            value={formData.handbook_link || ""}
            onChange={handleChange}
            className="px-3 py-2 rounded-lg border bg-transparent text-base"
            style={{
              borderColor: "var(--color-border)",
              color: "var(--color-text-main)",
            }}
            placeholder="https://..."
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-400">
          Доступные семестры
          <div className="flex flex-wrap gap-4 mt-1">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
              <label
                key={sem}
                className="flex items-center gap-2 cursor-pointer text-gray-800 dark:text-gray-300"
              >
                <input
                  type="checkbox"
                  checked={(formData.available_semesters || []).includes(sem)}
                  onChange={(e) => {
                    const sems = new Set(formData.available_semesters || []);
                    if (e.target.checked) sems.add(sem);
                    else sems.delete(sem);
                    setFormData((p) => ({
                      ...p,
                      available_semesters: Array.from(sems).sort(),
                    }));
                  }}
                  className="w-4 h-4 rounded border-gray-600"
                />
                {sem} семестр
              </label>
            ))}
          </div>
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-400">
          Доступные потоки (годы поступления через запятую, например 2024, 2025)
          <input
            type="text"
            value={(formData.allowed_cohorts || []).join(", ")}
            onChange={(e) =>
              setFormData((p) => ({
                ...p,
                allowed_cohorts: e.target.value
                  .split(",")
                  .map((s) => parseInt(s.trim()))
                  .filter((n) => !isNaN(n)),
              }))
            }
            className="px-3 py-2 rounded-lg border bg-transparent text-base"
            style={{
              borderColor: "var(--color-border)",
              color: "var(--color-text-main)",
            }}
            placeholder="Все"
          />
        </label>

        <CourseMultiSelect
          allCourses={allCourses.filter((c) => c.id !== course.id)}
          selectedIds={formData.prerequisites || []}
          onChange={(ids) => setFormData((p) => ({ ...p, prerequisites: ids }))}
          label="Пререквизиты"
        />

        <CourseMultiSelect
          allCourses={allCourses.filter((c) => c.id !== course.id)}
          selectedIds={formData.corequisites || []}
          onChange={(ids) => setFormData((p) => ({ ...p, corequisites: ids }))}
          label="Кореквизиты"
        />

        <div className="flex justify-end gap-3 mt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 rounded-lg border font-medium cursor-pointer"
            style={{ borderColor: "var(--color-border)" }}
          >
            Отмена
          </button>
          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-white font-medium cursor-pointer"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            <Save size={18} /> Сохранить
          </button>
        </div>
      </form>
    </div>
  );
}

function CourseMultiSelect({
  allCourses,
  selectedIds,
  onChange,
  label,
}: {
  allCourses: Course[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  label: string;
}) {
  const [search, setSearch] = useState("");

  const toggleId = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((i) => i !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const filtered = allCourses.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="flex flex-col gap-1.5 text-sm font-medium text-gray-400">
      {label}
      <div
        className="border rounded-lg p-2 flex flex-col gap-2"
        style={{ borderColor: "var(--color-border)" }}
      >
        <input
          type="text"
          placeholder="Поиск курса..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 rounded-md bg-transparent border text-base"
          style={{
            borderColor: "var(--color-border)",
            color: "var(--color-text-main)",
          }}
        />
        <div className="max-h-48 overflow-y-auto flex flex-col gap-1 pr-2">
          {filtered.map((c) => (
            <label
              key={c.id}
              className="flex items-center gap-2 cursor-pointer p-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-md text-gray-800 dark:text-gray-300"
            >
              <input
                type="checkbox"
                checked={selectedIds.includes(c.id)}
                onChange={() => toggleId(c.id)}
                className="w-4 h-4 rounded border-gray-600"
              />
              <span className="truncate">{c.title}</span>
            </label>
          ))}
          {filtered.length === 0 && (
            <div className="text-gray-500 p-2 text-center">
              Ничего не найдено
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MajorEditor({
  major,
  allCourses,
  onSave,
  onCancel,
}: {
  major: Major;
  allCourses: Course[];
  onSave: (m: Major) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    ...major,
    requirements:
      major.requirements || ([] as { course_id: string; type: string }[]),
  });
  const [search, setSearch] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...major,
      title: formData.title,
      school: formData.school,
      cohort_year: formData.cohort_year,
      requirements: formData.requirements,
    });
  };

  const toggleCourse = (id: string) => {
    const exists = formData.requirements.find((r) => r.course_id === id);
    if (exists) {
      setFormData((p) => ({
        ...p,
        requirements: p.requirements.filter((r) => r.course_id !== id),
      }));
    } else {
      setFormData((p) => ({
        ...p,
        requirements: [
          ...p.requirements,
          { course_id: id, type: "major_core" },
        ],
      }));
    }
  };

  const setReqType = (courseId: string, type: string) => {
    setFormData((p) => ({
      ...p,
      requirements: p.requirements.map((r) =>
        r.course_id === courseId ? { ...r, type } : r,
      ),
    }));
  };

  const filtered = allCourses.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase()),
  );
  const selectedIds = formData.requirements.map((r) => r.course_id);
  const reqMap = Object.fromEntries(
    formData.requirements.map((r) => [r.course_id, r.type]),
  );

  return (
    <div
      className="max-w-3xl mx-auto w-full p-6 rounded-2xl border"
      style={{
        backgroundColor: "var(--color-bg-card)",
        borderColor: "var(--color-border)",
      }}
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Редактировать направление</h2>
        <button
          onClick={onCancel}
          className="p-2 rounded-md hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer text-gray-500"
        >
          <X size={20} />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-400">
          Название
          <input
            required
            name="title"
            value={formData.title}
            onChange={(e) =>
              setFormData((p) => ({ ...p, title: e.target.value }))
            }
            className="px-3 py-2 rounded-lg border bg-transparent text-base"
            style={{
              borderColor: "var(--color-border)",
              color: "var(--color-text-main)",
            }}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-400">
          Школа (Факультет)
          <input
            name="school"
            value={formData.school || ""}
            onChange={(e) =>
              setFormData((p) => ({ ...p, school: e.target.value }))
            }
            className="px-3 py-2 rounded-lg border bg-transparent text-base"
            style={{
              borderColor: "var(--color-border)",
              color: "var(--color-text-main)",
            }}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-400">
          Год мейджора
          <input
            type="number"
            min="2000"
            max="2100"
            value={formData.cohort_year || ""}
            onChange={(e) =>
              setFormData((p) => ({
                ...p,
                cohort_year: e.target.value
                  ? parseInt(e.target.value, 10)
                  : undefined,
              }))
            }
            className="px-3 py-2 rounded-lg border bg-transparent text-base"
            style={{
              borderColor: "var(--color-border)",
              color: "var(--color-text-main)",
            }}
            placeholder="Например 2024"
          />
        </label>

        <div className="flex flex-col gap-1.5 text-sm font-medium text-gray-400">
          Курсы направления ({formData.requirements.length} выбрано)
          <div
            className="border rounded-lg p-2 flex flex-col gap-2"
            style={{ borderColor: "var(--color-border)" }}
          >
            <input
              type="text"
              placeholder="Поиск курса..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-3 py-2 rounded-md bg-transparent border text-base"
              style={{
                borderColor: "var(--color-border)",
                color: "var(--color-text-main)",
              }}
            />
            <div className="max-h-72 overflow-y-auto flex flex-col gap-1 pr-2">
              {filtered.map((c) => {
                const isSelected = selectedIds.includes(c.id);
                return (
                  <div
                    key={c.id}
                    className={`flex items-center gap-2 p-1.5 rounded-md ${isSelected ? "bg-blue-500/10" : "hover:bg-black/5 dark:hover:bg-white/5"}`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleCourse(c.id)}
                      className="w-4 h-4 rounded border-gray-600 cursor-pointer"
                    />
                    <span
                      className="truncate flex-1 text-gray-800 dark:text-gray-300 cursor-pointer"
                      onClick={() => toggleCourse(c.id)}
                    >
                      {c.title}
                    </span>
                    {isSelected && (
                      <select
                        value={reqMap[c.id] || "major_core"}
                        onChange={(e) => setReqType(c.id, e.target.value)}
                        className="text-xs px-2 py-1 rounded border bg-transparent cursor-pointer"
                        style={{
                          borderColor: "var(--color-border)",
                          color: "var(--color-text-main)",
                        }}
                      >
                        <option
                          value="major_core"
                          className="bg-black text-white"
                        >
                          major core
                        </option>
                        <option
                          value="major_choice"
                          className="bg-black text-white"
                        >
                          major choice
                        </option>
                        <option value="flex" className="bg-black text-white">
                          flex
                        </option>
                        <option
                          value="university"
                          className="bg-black text-white"
                        >
                          общеуниверситетский
                        </option>
                        <option
                          value="elective"
                          className="bg-black text-white"
                        >
                          факультатив
                        </option>
                        <option value="minor" className="bg-black text-white">
                          Minor
                        </option>
                        <option value="soft" className="bg-black text-white">
                          soft
                        </option>
                        <option
                          value="selected_topics"
                          className="bg-black text-white"
                        >
                          selected topics
                        </option>
                      </select>
                    )}
                  </div>
                );
              })}
              {filtered.length === 0 && (
                <div className="text-gray-500 p-2 text-center">
                  Ничего не найдено
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 rounded-lg border font-medium cursor-pointer"
            style={{ borderColor: "var(--color-border)" }}
          >
            Отмена
          </button>
          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-white font-medium cursor-pointer"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            <Save size={18} /> Сохранить
          </button>
        </div>
      </form>
    </div>
  );
}
