export function getCategoryColor(category: string): string {
  const cat = category.toLowerCase();
  if (cat.includes("stem")) return "#4B9B9B";
  if (cat.includes("business")) return "#FF7E3D";
  if (cat.includes("tech")) return "#00A3FF";
  if (cat.includes("soft")) return "#C0EB00";
  return "#8B5CF6";
}
