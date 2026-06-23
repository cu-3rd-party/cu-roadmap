import { useState } from "react";

import { useAllMajorsQuery } from "@/entities/major";
import { usePlannerStore } from "@/entities/roadmap";
import { ADMISSION_YEARS } from "@/shared/constants";
import { useMediaQuery } from "@/shared/lib";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  RevealImage,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/shared/ui";

import { useSettingsStore } from "../model";

export const GreetingModal = () => {
  const {
    hasSeenGreeting,
    completeGreeting,
    setMajorId: persistMajorId,
  } = useSettingsStore();
  const [admissionYear, setAdmissionYear] = useState("");
  const [majorId, setMajorId] = useState("");
  const isMobile = useMediaQuery("sm");

  const { data: majors } = useAllMajorsQuery();
  const yearMajors =
    majors?.filter((m) => m.cohortYear === Number(admissionYear)) ?? [];

  const handleYearChange = (value: string) => {
    setAdmissionYear(value);
    setMajorId("");
  };

  const handleProceed = () => {
    if (!admissionYear || !majorId) return;
    completeGreeting(Number(admissionYear) as (typeof ADMISSION_YEARS)[number]);
    persistMajorId(majorId);
  };

  const description = (
    <>
      <p>
        Цель этого конструктора - помочь тебе собрать свою оптимальную
        траекторию учебы.
      </p>
      <p>
        Для начала выбери год своего поступления в ЦУ и мейджор (обе опции позже
        можно будет изменить в настройках):
      </p>
    </>
  );

  const fields = (
    <>
      <div className="flex flex-col gap-1.5">
        <span className="text-sm text-fg-primary">Год поступления</span>
        <Select value={admissionYear} onValueChange={handleYearChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="" />
          </SelectTrigger>
          <SelectContent>
            {ADMISSION_YEARS.map((y) => (
              <SelectItem key={y} value={String(y)}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm text-fg-primary">Мейджор</span>
        <Select value={majorId} onValueChange={setMajorId}>
          <SelectTrigger className="w-full" disabled={!admissionYear}>
            <SelectValue placeholder="" />
          </SelectTrigger>
          <SelectContent>
            {yearMajors.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        size="md"
        className="w-full"
        variant="outline"
        disabled={!admissionYear || !majorId}
        onClick={handleProceed}
      >
        Продолжить
      </Button>
    </>
  );

  if (isMobile) {
    return (
      <Sheet open={!hasSeenGreeting}>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          onEscapeKeyDown={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          className="gap-0 overflow-hidden rounded-t-3xl bg-education-green-pale p-0"
        >
          <SheetHeader className="relative shrink-0 overflow-hidden px-8 pt-7 pb-4">
            <SheetTitle className="text-2xl font-bold text-fg-primary">
              Привет!
            </SheetTitle>
            <RevealImage
              src="/character2.png"
              alt="Персонаж 1"
              aria-hidden
              className="pointer-events-none absolute top-1 right-8 h-28 w-auto select-none object-contain"
            />
          </SheetHeader>

          <div className="flex flex-col gap-4 rounded-t-2xl bg-background p-5">
            <SheetDescription className="flex flex-col gap-4 text-sm leading-snug text-fg-primary">
              {description}
            </SheetDescription>
            {fields}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={!hasSeenGreeting}>
      <DialogContent
        showCloseButton={false}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        className="flex w-[calc(100%-2rem)] min-w-xl flex-col gap-0 overflow-hidden rounded-3xl bg-education-green-pale p-0"
      >
        <DialogHeader className="relative shrink-0 overflow-hidden px-8 pt-7 pb-4">
          <DialogTitle className="text-2xl font-bold text-fg-primary">
            Привет!
          </DialogTitle>
          <RevealImage
            src="/character2.png"
            alt="Персонаж 1"
            aria-hidden
            className="pointer-events-none absolute top-1 right-8 h-28 w-auto select-none object-contain"
          />
        </DialogHeader>

        <div className="flex flex-col">
          <div className="flex flex-col gap-4 rounded-2xl bg-background p-5">
            <DialogDescription className="flex flex-col gap-4 text-sm leading-snug text-fg-primary">
              {description}
            </DialogDescription>
            {fields}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
