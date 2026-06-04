import { useEffect, useState } from "react";

import { usePlannerStore } from "@/entities/roadmap";
import { ADMISSION_YEARS, type AdmissionYear } from "@/shared/constants";
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
} from "@/shared/ui";

import { useSettingsStore } from "../model";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SettingsModal = ({ open, onOpenChange }: SettingsModalProps) => {
  const { admissionYear, setAdmissionYear } = useSettingsStore();
  const { reset } = usePlannerStore();
  const [selectedYear, setSelectedYear] = useState("");

  useEffect(() => {
    if (open) {
      setSelectedYear(admissionYear ? String(admissionYear) : "");
    }
  }, [open, admissionYear]);

  const handleProceed = () => {
    if (!selectedYear) return;
    setAdmissionYear(Number(selectedYear) as AdmissionYear);
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex w-[calc(100%-2rem)] max-w-md flex-col gap-0 overflow-hidden rounded-3xl bg-education-green-pale p-0">
        <DialogHeader className="relative shrink-0 overflow-hidden px-8 pt-7 pb-4">
          <DialogTitle className="text-2xl font-bold text-fg-primary">
            Настройки
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col">
          <div className="flex flex-col gap-4 rounded-2xl bg-background p-5">
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm text-fg-primary">Год поступления</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
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
              disabled={!selectedYear}
              onClick={handleProceed}
            >
              Сохранить изменения
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
