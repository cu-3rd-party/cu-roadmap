// Picks the Russian plural form for n: [one, few, many]
// e.g. pluralizeRu(2, ["лекция", "лекции", "лекций"]) => "лекции"
export const pluralizeRu = (
  n: number,
  forms: [one: string, few: string, many: string],
): string => {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20))
    return forms[1];
  return forms[2];
};
