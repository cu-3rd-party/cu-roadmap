import { ArrowRight } from "lucide-react";
import { useState } from "react";

import { useCoursesQuery } from "@/entities/course";
import { useMajorsQuery } from "@/entities/major";
import { RoadmapResult } from "@/entities/roadmap";
import { PassedCoursesGrid } from "@/features/passed-courses";
import {
  GenerateRoadmapForm,
  useFixPrereq,
  useGenerateRoadmapMutation,
} from "@/features/roadmap-generation";
import { useRoadmapStore } from "@/shared/store";
import { Badge } from "@/shared/ui/kit/badge";
import { Button } from "@/shared/ui/kit/button";

import { StepIndicator } from "./ui";

const WizardPage = () => {
  const { passedIds, roadmapData, setRoadmapData } = useRoadmapStore();
  const { data: courses = [] } = useCoursesQuery();
  const { data: majors = [] } = useMajorsQuery();

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedMajor, setSelectedMajor] = useState("");
  const [startSem, setStartSem] = useState(1);

  const { mutate, isPending } = useGenerateRoadmapMutation();

  const generate = () => {
    if (!selectedMajor) return;
    mutate(
      {
        passed_course_ids: passedIds,
        major_id: selectedMajor,
        current_semester: startSem,
        max_load: 12.0,
      },
      { onSuccess: () => setCurrentStep(3) },
    );
  };

  const fixPrereq = useFixPrereq(courses, generate);

  const majorTitle =
    majors.find((m) => m.id === selectedMajor)?.title || selectedMajor;

  return (
    <div className="flex flex-col w-full h-full">
      <StepIndicator currentStep={currentStep} />

      <div className="flex-1 relative">
        <div className="overflow-y-auto h-full pb-20">
          {currentStep === 1 && <PassedCoursesGrid courses={courses} />}

          {currentStep === 2 && (
            <GenerateRoadmapForm
              majors={majors}
              selectedMajor={selectedMajor || (majors[0]?.id ?? "")}
              onSelectedMajorChange={setSelectedMajor}
              startSem={startSem}
              onStartSemChange={setStartSem}
              isPending={isPending}
              onBack={() => setCurrentStep(1)}
              onGenerate={generate}
            />
          )}

          {currentStep === 3 && roadmapData?.roadmap && (
            <div className="flex flex-col">
              <div className="flex justify-center mb-2">
                <Badge
                  variant="outline"
                  className="px-3 py-1 text-xs font-bold uppercase tracking-wider border-primary text-primary"
                >
                  Направление: {majorTitle}
                </Badge>
              </div>
              <RoadmapResult
                roadmap={roadmapData.roadmap}
                allCourses={courses}
                passedIds={passedIds}
                onReset={() => {
                  setRoadmapData(null);
                  setCurrentStep(1);
                }}
                onEditSettings={() => setCurrentStep(2)}
                fixPrereq={fixPrereq}
              />
            </div>
          )}
        </div>

        {currentStep === 1 && (
          <Button
            size="lg"
            onClick={() => setCurrentStep(2)}
            disabled={passedIds.length === 0}
            className="fixed bottom-20 md:bottom-6 right-6 z-50 shadow-lg"
          >
            Далее <ArrowRight size={18} />
          </Button>
        )}
      </div>
    </div>
  );
};

export default WizardPage;
