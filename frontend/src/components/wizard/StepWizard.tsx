import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE } from "../../consts";
import { CourseSelection } from "./CourseSelection";
import { MajorSelect } from "./MajorSelection";
import { AISparkleBox } from "../AISparkleBox";
import { ArrowRight, Sparkles } from "lucide-react";
import { RoadmapResult } from "./RoadmapResult";
import { SemesterSelector } from "./SemesterSelector";
import { StepNavigation } from "./StepNavigation";
import { StepIndicator } from "./StepIndicator";

export interface StepWizardProps {
  passedIds: string[];
  setPassedIds: any;
  roadmapData: any;
  setRoadmapData: any;
  loading: boolean;
  setLoading: any;
}

export function StepWizard({
  passedIds,
  setPassedIds,
  roadmapData,
  setRoadmapData,
  loading,
  setLoading,
}: StepWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [courses, setCourses] = useState<any[]>([]);
  const [majors, setMajors] = useState<any[]>([]);
  const [selectedMajor, setSelectedMajor] = useState("");
  const [startSem, setStartSem] = useState(1);

  useEffect(() => {
    axios.get(`${API_BASE}/courses/`).then((res) => setCourses(res.data));
    axios.get(`${API_BASE}/majors/`).then((res) => {
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
    axios
      .post(`${API_BASE}/planner/generate/`, {
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
                <h2 className="text-2xl font-bold mb-2">
                  Настройка траектории
                </h2>
                <p className="text-gray-500">
                  Выберите направление и укажите, когда вы поступили
                </p>
              </div>

              <div className="max-w-xl mx-auto bg-gray-50 rounded-2xl p-6">
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
                nextLabel="Построить траекторию"
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
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-primary text-white border-none px-6 py-3 rounded-xl font-bold text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors shadow-lg"
          >
            Далее <ArrowRight size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
