interface FormSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { id: string; title: string }[];
  label: string;
  placeholder?: string;
}

export function FormSelect({
  value,
  onChange,
  options,
  label,
  placeholder,
}: FormSelectProps) {
  return (
    <div className="flex flex-col gap-2 flex-1">
      <label
        className="text-xs font-bold uppercase"
        style={{ color: "var(--color-text-muted)" }}
      >
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-2.5 border rounded-lg text-base"
        style={{
          backgroundColor: "var(--color-bg-main)",
          color: "var(--color-text-main)",
          borderColor: "var(--color-border)",
        }}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.title}
          </option>
        ))}
      </select>
    </div>
  );
}
