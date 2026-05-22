export function getCategoryLabel(category: string): string {
  const cat = category.toLowerCase();

  if (cat.includes("ai")) return "AI";
  if (cat.includes("stem")) return "STEM";
  if (cat.includes("business")) return "Business";
  if (cat.includes("tech")) return "Tech";
  if (cat.includes("soft")) return "Soft Skills";
  if (cat.includes("design")) return "Design";

  return category;
}
