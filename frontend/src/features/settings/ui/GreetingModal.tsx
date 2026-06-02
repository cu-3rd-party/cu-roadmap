import { useState } from "react";

import { ADMISSION_YEARS } from "@/shared/constants";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui";

import { useSettingsStore } from "../model";

export const GreetingModal = () => {
  const { hasSeenGreeting, completeGreeting } = useSettingsStore();
  const [admissionYear, setAdmissionYear] = useState("");

  const handleProceed = () => {
    if (!admissionYear) return;
    completeGreeting(Number(admissionYear) as (typeof ADMISSION_YEARS)[number]);
  };

  return (
    <Dialog open={!hasSeenGreeting}>
      <DialogContent
        showCloseButton={false}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        className="flex w-[calc(100%-2rem)] max-w-md flex-col gap-0 overflow-hidden rounded-3xl bg-education-green-pale p-0"
      >
        <DialogHeader className="relative shrink-0 overflow-hidden px-8 pt-7 pb-4">
          <DialogTitle className="text-2xl font-bold text-fg-primary">
            Привет!
          </DialogTitle>
          <img
            src="/character2.png"
            alt="Персонаж 1"
            aria-hidden
            className="pointer-events-none absolute top-1 right-8 h-28 w-auto select-none object-contain"
          />
        </DialogHeader>

        <div className="flex flex-col">
          <div className="flex flex-col gap-4 rounded-2xl bg-background p-5">
            <DialogDescription className="text-sm leading-snug text-fg-primary flex flex-col gap-4">
              <p>Цель этого конструктора - помочь тебе собрать свою оптимальную траекторию учебы.</p>
              <p>Для начала выбери год своего поступления в ЦУ (позже его можно будет изменить в настройках):</p>
            </DialogDescription>

            <div className="flex flex-col gap-1.5">
              <Select value={admissionYear} onValueChange={setAdmissionYear}>
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

            <Button
              size="md"
              className="w-full"
              variant="outline"
              disabled={!admissionYear}
              onClick={handleProceed}
            >
              Продолжить
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
