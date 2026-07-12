import { cn, useMediaQuery } from "@/shared/lib";
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  RevealImage,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/shared/ui";

import { useTrajectorySelect } from "../model";

import { CourseTab } from "./CourseTab";
import { FieldLabel } from "./FieldLabel";
import { SpecializationTab } from "./SpecializationTab";

interface TrajectorySelectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const TrajectorySelectModal = ({
  open,
  onOpenChange,
}: TrajectorySelectModalProps) => {
  const {
    tab,
    error,
    canSubmit,
    loading,
    onTabChange,
    onSubmit,
    close,

    specializations,
    specializationId,
    onSpecializationChange,
    maxLoad,
    onMaxLoadChange,
    scope,
    onScopeChange,

    courseQuery,
    courseOpen,
    courseHints,
    courseId,
    onCourseChange,
    onCourseBlur,
    onSelectCourse,
    semester,
    semesterOptions,
    onSemesterChange,
  } = useTrajectorySelect(onOpenChange);

  const isMobile = useMediaQuery("sm");

  const content = (
    <>
      <p className="text-xs sm:text-sm font-bold">
        Пока что не все детали отражаются в подобранной траектории, алгоритм
        дорабатывается.
      </p>
      <Tabs value={tab} onValueChange={onTabChange} className="gap-4">
        <FieldLabel
          label="Тип построения траектории"
          hint={
            <>
              <span className="font-medium">Специализация</span> — алгоритм
              соберет траекторию для выбранной вами специализации.
              <br />
              <br />
              <span className="font-medium">Курс</span> — алгоритм добавит все
              пререквизиты и кореквизиты выбранного курса так, чтобы пройти его
              в выбранном семестре.
            </>
          }
        />

        <TabsList className="grid grid-flow-col auto-cols-fr self-center">
          <TabsTrigger value="major">Специализация</TabsTrigger>
          <TabsTrigger value="course">Курс</TabsTrigger>
        </TabsList>

        <SpecializationTab
          specializations={specializations}
          specializationId={specializationId}
          onSpecializationChange={onSpecializationChange}
          maxLoad={maxLoad}
          onMaxLoadChange={onMaxLoadChange}
          scope={scope}
          onScopeChange={onScopeChange}
          isMobile={isMobile}
        />

        <CourseTab
          courseQuery={courseQuery}
          courseOpen={courseOpen}
          courseHints={courseHints}
          courseId={courseId}
          onCourseChange={onCourseChange}
          onCourseBlur={onCourseBlur}
          onSelectCourse={onSelectCourse}
          semester={semester}
          semesterOptions={semesterOptions}
          onSemesterChange={onSemesterChange}
        />
      </Tabs>

      <div className="mt-auto flex flex-col gap-4">
        <p className="text-xs sm:text-sm text-fg-secondary">
          Добавленные алгоритмом курсы{" "}
          <span className="inline-block rounded-md border-2 border-expert-blue px-1.5 py-0.5 font-medium text-fg-primary">
            будут обведены так
          </span>
        </p>

        {error && <p className="text-sm text-fg-negative">Ошибка: {error}</p>}

        <div className="flex items-center justify-between">
          <Button variant="tertiaryPadded" size="md" onClick={close}>
            Отмена
          </Button>
          <Button
            variant="outline"
            size={isMobile ? "sm" : "md"}
            onClick={onSubmit}
            disabled={!canSubmit}
            loading={loading}
          >
            Обновить траекторию
          </Button>
        </div>
      </div>
    </>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          swipeToClose
          aria-describedby={undefined}
          onOpenAutoFocus={(e) => e.preventDefault()}
          className="gap-0 overflow-hidden rounded-t-3xl bg-expert-blue-pale p-0"
        >
          <SheetHeader className="relative shrink-0 overflow-hidden px-8 pt-7 pb-4">
            <SheetTitle className="text-2xl font-bold text-fg-primary">
              Подбор траектории
            </SheetTitle>
            <RevealImage
              src="/character1.png"
              alt="Персонаж"
              aria-hidden
              className="pointer-events-none absolute top-1 right-8 h-28 w-auto select-none object-contain"
            />
          </SheetHeader>

          <div className="flex flex-col gap-4 rounded-t-2xl bg-background p-3 sm:p-5">
            {content}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        aria-describedby={undefined}
        onOpenAutoFocus={(e) => e.preventDefault()}
        className={cn(
          "flex w-[calc(100%-2rem)] sm:max-w-5xl flex-col gap-0 overflow-hidden rounded-3xl bg-expert-blue-pale p-0",
        )}
      >
        <DialogHeader className="relative shrink-0 overflow-hidden px-8 pt-7 pb-4">
          <DialogTitle className="text-2xl font-bold text-fg-primary">
            Подбор траектории
          </DialogTitle>
          <RevealImage
            src="/character1.png"
            alt="Персонаж"
            aria-hidden
            className="pointer-events-none absolute top-1 right-8 h-28 w-auto select-none object-contain"
          />
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex h-full flex-col gap-4 rounded-2xl bg-background p-5">
            {content}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
