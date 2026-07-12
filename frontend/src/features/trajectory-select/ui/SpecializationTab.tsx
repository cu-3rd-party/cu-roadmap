import { useEffect, useState } from "react";

import type { Specialization } from "@/entities/specialization";
import {
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Slider,
  TabsContent,
  TabsList,
  TabsTrigger,
  Tabs,
} from "@/shared/ui";

import { wrapLabel } from "../lib";
import { MAX_LOAD, MIN_LOAD } from "../model";

import { FieldLabel } from "./FieldLabel";

interface SpecializationTabProps {
  specializations: Specialization[] | undefined;
  specializationId: string;
  onSpecializationChange: (value: string) => void;
  maxLoad: number;
  onMaxLoadChange: (value: number) => void;
  scope: string;
  onScopeChange: (value: string) => void;
  isMobile: boolean;
}

export const SpecializationTab = ({
  specializations,
  specializationId,
  onSpecializationChange,
  maxLoad,
  onMaxLoadChange,
  scope,
  onScopeChange,
  isMobile,
}: SpecializationTabProps) => {
  // The number field keeps its own draft while focused so partial input (e.g.
  // typing the first digit of "12") isn't clamped mid-edit. It commits on blur
  // or Enter; the committed value flows back through maxLoad.
  const [loadDraft, setLoadDraft] = useState(String(maxLoad));

  useEffect(() => {
    setLoadDraft(String(maxLoad));
  }, [maxLoad]);

  const commitLoad = () => {
    const parsed = Number.parseInt(loadDraft, 10);
    if (Number.isNaN(parsed)) {
      setLoadDraft(String(maxLoad));
      return;
    }
    // Clamp here (not only in the hook) so the field is corrected even when the
    // clamped value equals the current maxLoad — in that case setMaxLoad is a
    // no-op and the resync effect wouldn't fire on its own.
    const clamped = Math.min(MAX_LOAD, Math.max(MIN_LOAD, parsed));
    setLoadDraft(String(clamped));
    onMaxLoadChange(clamped);
  };

  return (
    <TabsContent value="major" className="flex flex-col gap-3 self-center">
      <p className="text-xs sm:text-sm text-fg-secondary self-center">
        Специализация
      </p>
      {isMobile ? (
        <Select
          value={specializationId || "none"}
          onValueChange={(value) =>
            onSpecializationChange(value === "none" ? "" : value)
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Нет</SelectItem>
            {specializations &&
              specializations.map((specialization) => (
                <SelectItem key={specialization.id} value={specialization.id}>
                  {specialization.title}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      ) : (
        <Tabs
          value={specializationId}
          onValueChange={onSpecializationChange}
          className="gap-4 items-center"
        >
          <TabsList className="grid grid-flow-col auto-cols-fr">
            <TabsTrigger key={"specialization-empty-key"} value="">
              Нет
            </TabsTrigger>
            {specializations &&
              specializations.map((specialization) => (
                <TabsTrigger
                  key={specialization.id}
                  value={specialization.id}
                  className="whitespace-pre-line text-center"
                >
                  {wrapLabel(specialization.title)}
                </TabsTrigger>
              ))}
          </TabsList>
        </Tabs>
      )}

      <FieldLabel
        label="Какие курсы учитывать при построении траектории"
        hint={
          <>
            <span className="font-medium">Только пройденные</span> — алгоритм
            будет строить траекторию только исходя из курсов пройденных
            семестров.
            <br />
            <br />
            <span className="font-medium">Все добавленные</span> — алгоритм
            подберет курсы в траекторию, учитывая добавленные вами в еще не
            пройденных семестрах курсы.
          </>
        }
      />
      <Tabs value={scope} onValueChange={onScopeChange} className="gap-4">
        <TabsList className="grid grid-flow-col auto-cols-fr self-center">
          <TabsTrigger value="passed">Только пройденные</TabsTrigger>
          <TabsTrigger value="selected">Все добавленные</TabsTrigger>
        </TabsList>
      </Tabs>

      <FieldLabel
        label="Максимальная нагрузка в парах в неделю"
        hint="Алгоритм выберет курсы так, чтобы ни в одном семестре не превышать выставленную нагрузку в неделю."
      />
      <div className="flex items-center gap-4 self-center">
        <Slider
          min={MIN_LOAD}
          max={MAX_LOAD}
          step={1}
          value={[maxLoad]}
          onValueChange={(value) => onMaxLoadChange(value[0])}
          className="w-64"
        />
        <Input
          type="number"
          inputMode="numeric"
          min={MIN_LOAD}
          max={MAX_LOAD}
          step={1}
          size="sm"
          value={loadDraft}
          onChange={(e) => setLoadDraft(e.target.value)}
          onBlur={commitLoad}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commitLoad();
            }
          }}
          wrapperClassName="w-16 shrink-0"
          className="text-center tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none"
        />
      </div>
    </TabsContent>
  );
};
