import React, { useState } from "react";
import axios from "axios";
import { API_BASE } from "../consts";

interface MajorCalculatorViewProps {
  passedIds: string[];
  setPassedIds: React.Dispatch<React.SetStateAction<string[]>>;
}

interface MajorResult {
  id: string;
  title: string;
  score: number;
}

export function MajorCalculatorView({ passedIds }: MajorCalculatorViewProps) {
  const [results, setResults] = useState<MajorResult[]>([]);
  const [loading, setLoading] = useState(false);

  const calculate = () => {
    setLoading(true);
    axios
      .post(`${API_BASE}/majors/identify/`, passedIds)
      .then((res) => {
        setResults(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  return (
    <div className="flex flex-col w-full">
      <h1
        className="text-3xl font-extrabold"
        style={{ color: "var(--color-text-main)" }}
      >
        Подбор мейджора
      </h1>
      <p className="mb-6" style={{ color: "var(--color-text-muted)" }}>
        Система проанализирует выбранные курсы и подскажет наиболее подходящее
        направление.
      </p>

      <div className="flex gap-5 mb-8">
        <button
          className="text-white border-none px-4 py-2 rounded-lg font-bold text-sm cursor-pointer"
          style={{ backgroundColor: "var(--color-primary)" }}
          onClick={calculate}
          disabled={loading}
        >
          {loading ? "Анализируем..." : "Рассчитать соответствие"}
        </button>
      </div>

      <div
        className="grid gap-6"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}
      >
        {results.map((r) => (
          <div
            key={r.id}
            className="rounded-2xl p-6"
            style={{
              backgroundColor: "var(--color-bg-main)",
              borderWidth: 1,
              borderStyle: "solid",
              borderColor: "var(--color-border)",
              cursor: "default",
            }}
          >
            <h2
              className="text-xl font-bold mb-2"
              style={{ color: "var(--color-text-main)" }}
            >
              {r.title}
            </h2>
            <div
              className="font-extrabold text-2xl"
              style={{ color: "var(--color-primary)" }}
            >
              {(r.score * 100).toFixed(0)}%
            </div>
            <div
              className="h-1.5 rounded mt-3 overflow-hidden"
              style={{ backgroundColor: "var(--color-bg-hover)" }}
            >
              <div
                style={{
                  width: `${r.score * 100}%`,
                  height: "100%",
                  background: "var(--color-primary)",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}