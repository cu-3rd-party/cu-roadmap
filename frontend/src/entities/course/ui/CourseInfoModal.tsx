import { ArrowRight, AlertTriangle, Info, Lock, Unlock } from "lucide-react";
import React from "react";

import { Badge } from "@/shared/ui/kit/badge";
import { Button } from "@/shared/ui/kit/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/kit/dialog";

import { getCategoryColor } from "../lib";
import type { Course } from "../model";

interface CourseInfoModalProps {
  course: Course;
  allCourses: Course[];
  onClose: () => void;
  onToggleSemester?: (semester: number) => void;
  currentSemester?: number;
  mandatoryCourseIds?: string[];
  passedIds?: string[];
}

export function CourseInfoModal({
  course,
  allCourses,
  onClose,
  onToggleSemester,
  currentSemester,
  mandatoryCourseIds = [],
  passedIds = [],
}: CourseInfoModalProps) {
  const isMandatory = mandatoryCourseIds.includes(course.id);
  const prerequisites = allCourses.filter((c) =>
    course.prerequisites?.includes(c.id),
  );
  const postrequisites = allCourses.filter((c) =>
    c.prerequisites?.includes(course.id),
  );
  const missingPrereqs = prerequisites.filter((p) => !passedIds.includes(p.id));

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg sm:max-w-lg max-h-[90vh] grid-rows-[auto_1fr] gap-0 p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4">
          <div
            className="text-xs font-bold uppercase tracking-widest mb-1"
            style={{ color: getCategoryColor(course.category) }}
          >
            {course.category}
          </div>
          <DialogTitle className="text-3xl font-black tracking-tight">
            {course.title}
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto px-6 pb-8 space-y-6">
          {isMandatory && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-green-badge text-green-badge-foreground">
              <Info size={16} />
              <span className="text-sm font-semibold">
                Обязательный для твоего мейджора
              </span>
            </div>
          )}

          {missingPrereqs.length > 0 && (
            <div className="flex flex-col gap-1 px-4 py-3 rounded-xl bg-red-badge">
              <div className="flex items-center gap-2 text-red-badge-foreground">
                <AlertTriangle size={16} />
                <span className="text-sm font-bold">
                  Не все пререквизиты выполнены
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                Нужно пройти: {missingPrereqs.map((p) => p.title).join(", ")}
              </div>
            </div>
          )}

          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">
              Описание
            </div>
            <p className="text-sm leading-relaxed text-foreground/80">
              {course.description || "Нет описания для этого курса."}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-muted border border-border">
              <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">
                Рек. Семестр
              </div>
              <div className="text-xl font-bold text-foreground">
                {course.recommended_semester || "—"}
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-muted border border-border">
              <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">
                Нагрузка
              </div>
              <div className="text-xl font-bold flex items-center gap-2 text-foreground">
                <span className="w-2 h-2 rounded-full bg-light-blue-badge-foreground"></span>
                {course.workload} к.
              </div>
            </div>
          </div>

          {isMandatory && (
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">
                Мейджоры
              </div>
              <div className="text-xs">
                <span className="text-muted-foreground mr-2">статус:</span>
                <Badge
                  variant="outline"
                  className="text-light-blue-badge-foreground"
                >
                  Обязательный (Core)
                </Badge>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {prerequisites.length > 0 && (
              <div>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">
                  <ArrowRight size={12} /> Пререквизиты
                </div>
                <div className="space-y-2">
                  {prerequisites.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-muted border border-border text-sm text-foreground"
                    >
                      {passedIds.includes(p.id) ? (
                        <Unlock
                          size={14}
                          className="text-green-badge-foreground"
                        />
                      ) : (
                        <Lock size={14} className="text-muted-foreground" />
                      )}
                      {p.title}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {postrequisites.length > 0 && (
              <div>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">
                  <Unlock size={12} /> Постреквизиты (открывает)
                </div>
                <div className="space-y-2">
                  {postrequisites.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-muted border border-border text-sm text-foreground"
                    >
                      <ArrowRight
                        size={14}
                        className="text-light-blue-badge-foreground"
                      />
                      {p.title}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">
              Цепочка зависимостей
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {(() => {
                const chain: Course[] = [];
                let curr: Course | undefined = prerequisites[0];
                let safety = 0;
                while (curr && safety < 3) {
                  chain.unshift(curr);
                  curr = allCourses.find((c) =>
                    curr?.prerequisites?.includes(c.id),
                  );
                  safety++;
                }
                return (
                  <>
                    {chain.map((c) => (
                      <React.Fragment key={c.id}>
                        <Badge variant="secondary" className="text-[10px]">
                          {c.title}
                        </Badge>
                        <ArrowRight
                          size={10}
                          className="text-muted-foreground"
                        />
                      </React.Fragment>
                    ))}
                    <Badge className="text-[10px] bg-green-badge text-green-badge-foreground">
                      {course.title}
                    </Badge>
                  </>
                );
              })()}
            </div>
          </div>

          <div className="pt-4 border-t border-border">
            <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">
              {currentSemester ? "В текущем плане:" : "Добавить в семестр:"}
            </div>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <Button
                  key={s}
                  variant={s === currentSemester ? "secondary" : "outline"}
                  size="icon-lg"
                  onClick={() => onToggleSemester?.(s)}
                  className="text-xs font-bold"
                >
                  C{s}
                  {s === currentSemester && (
                    <span className="ml-0.5 text-[8px]">★</span>
                  )}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
