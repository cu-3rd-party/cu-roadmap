import React, { useEffect, useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { api } from "@/shared/config";
import type { Course, Major } from "@/shared/config";
import { AISparkleBox } from "./ui/AISparkleBox";
import {
  CourseSelection,
  MajorSelect,
  SemesterSelector,
  StepIndicator,
  StepNavigation,
  RoadmapResult,
} from "./ui";
import type { RoadmapResponse } from "@/shared/config";

interface WizardPageProps {
  passedIds: string[];
  setPassedIds: React.Dispatch<React.SetStateAction<string[]>>;
  roadmapData: RoadmapResponse | null;
  setRoadmapData: React.Dispatch<React.SetStateAction<RoadmapResponse | null>>;
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

export function WizardPage({
  passedIds,
  setPassedIds,
  roadmapData,
  setRoadmapData,
  loading,
  setLoading,
}: WizardPageProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [courses, setCourses] = useState<Course[]>([]);
  const [majors, setMajors] = useState<Major[]>([]);
  const [selectedMajor, setSelectedMajor] = useState("");
  const [startSem, setStartSem] = useState(1);

  useEffect(() => {
    api.getCourses().then((res) => setCourses(res.data));
    api.getMajors().then((res) => {
      setMajors(res.data);
      if (res.data.length > 0) setSelectedMajor(res.data[0].id);
    });
  }, []);

  const toggleCourse = (id: string) => {
    setPassedIds((prev: string[]) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const generatePlan = () => {
    if (!selectedMajor) return;
    setLoading(true);
    api
      .generateRoadmap({
        passed_course_ids: passedIds,
        major_id: selectedMajor,
        current_semester: startSem,
        max_load: 12.0,
      })
      .then((res) => {
        setRoadmapData(res.data);
        setLoading(false);
        setCurrentStep(3);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  const fixPrereq = (courseTitle: string) => {
    const target = courses.find((c) => courseTitle.includes(c.title));
    if (target && !passedIds.includes(target.id)) {
      setPassedIds((prev: string[]) => [...prev, target.id]);
      setTimeout(generatePlan, 100);
    }
  };

  return (
    <div className="flex flex-col w-full h-full">
      <StepIndicator currentStep={currentStep} />

      <div className="flex-1 relative">
        <div className="overflow-y-auto h-full pb-20">
          {currentStep === 1 && (
            <CourseSelection
              courses={courses}
              passedIds={passedIds}
              onToggleCourse={toggleCourse}
            />
          )}

          {currentStep === 2 && (
            <div className="flex flex-col">
              <div className="text-center mb-6">
                <h2
                  className="text-2xl font-bold mb-2"
                  style={{ color: "var(--color-text-main)" }}
                >
                  Настройка траектории
                </h2>
                <p style={{ color: "var(--color-text-muted)" }}>
                  Выберите направление и укажите, когда вы поступили
                </p>
              </div>

              <div
                className="max-w-xl mx-auto rounded-2xl p-6"
                style={{ backgroundColor: "var(--color-bg-hover)" }}
              >
                <div className="flex flex-col gap-5">
                  <MajorSelect
                    majors={majors}
                    selectedMajor={selectedMajor}
                    onChange={setSelectedMajor}
                  />
                  <SemesterSelector value={startSem} onChange={setStartSem} />
                  <AISparkleBox />
                </div>
              </div>

              <StepNavigation
                onBack={() => setCurrentStep(1)}
                onNext={generatePlan}
                nextLabel="Построить траектории"
                nextIcon={<Sparkles size={18} />}
                loading={loading}
                disabled={!selectedMajor}
              />
            </div>
          )}

          {currentStep === 3 && roadmapData?.roadmap && (
            <RoadmapResult
              roadmap={roadmapData.roadmap}
              onReset={() => {
                setRoadmapData(null);
                setCurrentStep(1);
              }}
              onEditSettings={() => setCurrentStep(2)}
              fixPrereq={fixPrereq}
            />
          )}
        </div>

        {currentStep === 1 && (
          <button
            onClick={() => setCurrentStep(2)}
            disabled={passedIds.length === 0}
            className="fixed bottom-20 md:bottom-6 right-6 z-50 flex items-center gap-2 text-white border-none px-6 py-3 rounded-xl font-bold text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            Далее <ArrowRight size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
