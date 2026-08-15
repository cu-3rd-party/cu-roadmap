import { useEffect, useState } from "react";
import {
  api,
  type Specialization,
  type DisciplineGroup,
} from "@/shared/config";

interface Props {
  specialization: Specialization;
  onClose: () => void;
}

export function SpecializationBoxManager({ specialization, onClose }: Props) {
  const [boxes, setBoxes] = useState<DisciplineGroup[]>([]);
  const [attachedIds, setAttachedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadBoxes = async () => {
    try {
      setLoading(true);
      const [boxesRes, attachedRes] = await Promise.all([
        api.admin.getDisciplineGroups(),
        api.admin.getAttachedDisciplineGroups(specialization.id),
      ]);
      setBoxes(boxesRes.data);
      setAttachedIds(new Set(attachedRes.data || []));
      setError("");
    } catch (err: any) {
      setError(err.message || "Failed to load boxes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBoxes();
  }, []);

  const handleAttach = async (boxId: string) => {
    try {
      await api.admin.attachDisciplineGroup(boxId, specialization.id);
      setAttachedIds(new Set(attachedIds).add(boxId));
    } catch (err: any) {
      alert("Ошибка при привязке: " + (err.message || "Unknown error"));
    }
  };

  const handleDetach = async (boxId: string) => {
    try {
      await api.admin.detachDisciplineGroup(boxId, specialization.id);
      const newAttached = new Set(attachedIds);
      newAttached.delete(boxId);
      setAttachedIds(newAttached);
    } catch (err: any) {
      alert("Ошибка при отвязке: " + (err.message || "Unknown error"));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">
            Привязка коробок к: {specialization.title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {error && (
            <div className="mb-4 bg-red-50 text-red-600 p-4 rounded-md">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-8">Загрузка коробок...</div>
          ) : (
            <div className="space-y-4">
              {boxes.map((box) => (
                <div
                  key={box.id}
                  className={`border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow flex justify-between items-center ${
                    attachedIds.has(box.id)
                      ? "bg-green-50 border-green-200"
                      : "bg-white"
                  }`}
                >
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900 flex items-center gap-2">
                      {box.title}
                      {attachedIds.has(box.id) && (
                        <span className="text-xs font-bold text-green-700 bg-green-200 px-2 py-1 rounded-full">
                          ПРИВЯЗАНА
                        </span>
                      )}
                    </h3>
                    <p className="text-sm text-gray-500">ID: {box.id}</p>
                  </div>
                  <div className="flex gap-2">
                    {!attachedIds.has(box.id) ? (
                      <button
                        onClick={() => handleAttach(box.id)}
                        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors font-medium"
                      >
                        Привязать
                      </button>
                    ) : (
                      <button
                        onClick={() => handleDetach(box.id)}
                        className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded hover:bg-red-100 transition-colors font-medium"
                      >
                        Отвязать
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {boxes.length === 0 && (
                <div className="text-gray-500 text-center py-8">
                  Нет доступных коробок
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
