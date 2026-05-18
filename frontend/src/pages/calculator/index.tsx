import {
  MajorMatchCard,
  useIdentifyMajorsMutation,
} from "@/features/major-identification";
import { useRoadmapStore } from "@/shared/store";
import { Button } from "@/shared/ui/kit/button";

const CalculatorPage = () => {
  const { passedIds } = useRoadmapStore();
  const { mutate, data: results = [], isPending } = useIdentifyMajorsMutation();

  return (
    <div className="flex flex-col w-full">
      <h1 className="text-3xl font-extrabold text-foreground">
        Подбор мейджора
      </h1>
      <p className="mb-6 text-muted-foreground">
        Система проанализирует выбранные курсы и подскажет наиболее подходящее
        направление.
      </p>

      <div className="flex gap-5 mb-8">
        <Button onClick={() => mutate(passedIds)} disabled={isPending}>
          {isPending ? "Анализируем..." : "Рассчитать соответствие"}
        </Button>
      </div>

      <div
        className="grid gap-6"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}
      >
        {results.map((r) => (
          <MajorMatchCard key={r.id} result={r} />
        ))}
      </div>
    </div>
  );
};

export default CalculatorPage;
