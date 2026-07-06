import type { Specialization } from "@/entities/specialization";
import {
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
                  className="whitespace-pre-line text-center leading-tight"
                >
                  {wrapLabel(specialization.title)}
                </TabsTrigger>
              ))}
          </TabsList>
        </Tabs>
      )}

      <p className="text-xs sm:text-sm text-fg-secondary self-center">
        Какие курсы учитывать при построении траектории
      </p>
      <Tabs value={scope} onValueChange={onScopeChange} className="gap-4">
        <TabsList className="grid grid-flow-col auto-cols-fr self-center">
          <TabsTrigger value="passed">Только пройденные</TabsTrigger>
          <TabsTrigger value="selected">Все добавленные</TabsTrigger>
        </TabsList>
      </Tabs>

      <p className="text-xs sm:text-sm text-fg-secondary self-center">
        Максимальная нагрузка в парах в неделю:{" "}
        <span className="font-medium text-fg-primary">{maxLoad}</span>
      </p>
      <Slider
        min={6}
        max={20}
        step={1}
        value={[maxLoad]}
        onValueChange={(value) => onMaxLoadChange(value[0])}
        className="w-64 self-center"
      />
    </TabsContent>
  );
};
