interface TemplanCardProps {
  label: string;
  value: string;
}

export const TemplanCard = ({ label, value }: TemplanCardProps) => (
  <div className="relative overflow-hidden rounded-xl bg-sure-pink-pale p-4">
    <div className="text-sm text-fg-sure-pink">{label}</div>
    <div className="text-lg font-medium text-fg-primary">{value}</div>
    <img
      src="/confederate.png"
      alt=""
      aria-hidden
      className="pointer-events-none absolute right-6 top-1 w-28 h-20 select-none"
    />
  </div>
);
