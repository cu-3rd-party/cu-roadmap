import { useParams } from "react-router-dom";

import { useStructureQuery } from "@/entities/major";
import {
  MOCK_RESTRICTION_RULES,
  RestrictionRuleCard,
  SpecializationDetailHeader,
} from "@/features/admin-restrictions";
import { Button, PageLoader, PagePlaceholder } from "@/shared/ui";

// The "Ограничения" half of the specialization editor. Rules are still mocked
// until the 2.0 restrictions endpoints exist, but the specialization itself is
// real: there is no GET /specializations/:id, so the structure tree is what
// resolves the id from the URL on a cold load.
const RestrictionsPage = () => {
  const { specializationId } = useParams<{ specializationId: string }>();
  const { data: structure, isLoading } = useStructureQuery();

  const specialization = structure
    ?.flatMap(({ majors }) => majors)
    .flatMap(({ specializations }) => specializations)
    .find(({ id }) => id === specializationId);

  // Without this a refresh would flash the not-found placeholder before the
  // tree lands.
  if (isLoading) {
    return <PageLoader />;
  }

  if (!specialization) {
    return (
      <PagePlaceholder
        title="Специализация не найдена"
        description="Проверьте ссылку или вернитесь к списку специализаций."
      />
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-screen-2xl flex-col gap-2">
      <SpecializationDetailHeader
        title={specialization.title}
        tab="restrictions"
        /* Inert until the courses screen exists — the header already takes the
           handler, so wiring it up is a one-line change. */
        onTabChange={() => {}}
        tabsHint="Курсы задают состав специализации, ограничения — правила выбора курсов."
        action={
          <Button variant="outline" size="sm">
            Добавить правило
          </Button>
        }
      />

      {MOCK_RESTRICTION_RULES.map((rule) => (
        <RestrictionRuleCard key={rule.id} rule={rule} />
      ))}
    </div>
  );
};

export default RestrictionsPage;
