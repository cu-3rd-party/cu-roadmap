import { cn } from "@/shared/lib/cn";

export const FilterCard = ({
  label,
  className,
  children,
}: {
  label?: string;
  className?: string;
  children: React.ReactNode;
}) => {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl bg-background p-4",
        className,
      )}
    >
      {label && (
        <span className="text-xs font-medium text-fg-tertiary">{label}</span>
      )}
      {children}
    </div>
  );
}