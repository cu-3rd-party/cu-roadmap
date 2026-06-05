import type { Major } from "@/entities/major";
import { useMediaQuery } from "@/shared/lib";
import { majorToShortName } from "@/shared/model";
import { TabsContent, TabsList, TabsTrigger, Tabs } from "@/shared/ui";

interface MajorTabProps {
  majors: Major[] | undefined;
  majorId: string;
  onMajorChange: (value: string) => void;
  scope: string;
  onScopeChange: (value: string) => void;
}

export const MajorTab = ({
  majors,
  majorId,
  onMajorChange,
  scope,
  onScopeChange,
}: MajorTabProps) => {
  const isMobile = useMediaQuery("sm");
  return (
    <TabsContent value="major" className="flex flex-col gap-3 self-center">
      <p className="text-xs sm:text-sm text-fg-secondary self-center">
        Выберите мейджор
      </p>
      <Tabs
        value={majorId}
        onValueChange={onMajorChange}
        className="gap-4 items-center"
      >
        <TabsList className="grid grid-flow-col auto-cols-fr">
          {majors?.map((major) => (
            <TabsTrigger key={major.id} value={major.id}>
              {isMobile ? majorToShortName[major.title] : major.title}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <p className="text-xs sm:text-sm text-fg-secondary self-center">
        Какие курсы учитывать в построении траектории
      </p>
      <Tabs value={scope} onValueChange={onScopeChange} className="gap-4">
        <TabsList className="grid grid-flow-col auto-cols-fr self-center">
          <TabsTrigger value="passed">Пройденные</TabsTrigger>
          <TabsTrigger value="selected">Все</TabsTrigger>
        </TabsList>
      </Tabs>
    </TabsContent>
  );
};
