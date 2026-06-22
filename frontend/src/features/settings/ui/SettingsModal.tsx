import { useEffect, useState } from "react";

import { useAllMajorsQuery } from "@/entities/major";
import { usePlannerStore } from "@/entities/roadmap";
import { ADMISSION_YEARS, type AdmissionYear } from "@/shared/constants";
import { useMediaQuery } from "@/shared/lib";
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/shared/ui";

import { useSettingsStore } from "../model";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SettingsModal = ({ open, onOpenChange }: SettingsModalProps) => {
  const { admissionYear, setAdmissionYear } = useSettingsStore();
  const { reset, majorId, setMajorId } = usePlannerStore();
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedMajorId, setSelectedMajorId] = useState("");
  const isMobile = useMediaQuery("sm");

  const { data: majors } = useAllMajorsQuery();
  const yearMajors =
    majors?.filter((m) => m.cohortYear === Number(selectedYear)) ?? [];

  useEffect(() => {
    if (open) {
      setSelectedYear(admissionYear ? String(admissionYear) : "");
      setSelectedMajorId(majorId ?? "");
    }
  }, [open, admissionYear, majorId]);

  const handleYearChange = (value: string) => {
    setSelectedYear(value);
    setSelectedMajorId("");
  };

  const handleProceed = () => {
    if (!selectedYear || !selectedMajorId) return;
    const yearChanged = Number(selectedYear) !== admissionYear;
    setAdmissionYear(Number(selectedYear) as AdmissionYear);
    if (yearChanged) reset();
    setMajorId(selectedMajorId);
    onOpenChange(false);
  };

  const fields = (
    <>
      <div className="flex flex-col gap-1.5">
        <Label className="text-sm text-fg-primary">Год поступления</Label>
        <Select value={selectedYear} onValueChange={handleYearChange}>
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
        <Label className="text-sm text-fg-primary">Мейджор</Label>
        <Select value={selectedMajorId} onValueChange={setSelectedMajorId}>
          <SelectTrigger className="w-full" disabled={!selectedYear}>
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
        disabled={!selectedYear || !selectedMajorId}
        onClick={handleProceed}
      >
        Сохранить изменения
      </Button>
    </>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="gap-0 overflow-hidden rounded-t-3xl bg-education-green-pale p-0"
        >
          <SheetHeader className="relative shrink-0 overflow-hidden px-8 pt-7 pb-4">
            <SheetTitle className="text-2xl font-bold text-fg-primary">
              Настройки
            </SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-4 rounded-t-2xl bg-background p-5">
            {fields}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex w-[calc(100%-2rem)] min-w-xl flex-col gap-0 overflow-hidden rounded-3xl bg-education-green-pale p-0">
        <DialogHeader className="relative shrink-0 overflow-hidden px-8 pt-7 pb-4">
          <DialogTitle className="text-2xl font-bold text-fg-primary">
            Настройки
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 rounded-2xl bg-background p-5">
          {fields}
        </div>
      </DialogContent>
    </Dialog>
  );
};
