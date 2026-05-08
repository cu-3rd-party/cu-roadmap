import React from "react";

interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string; label: string }[];
}

export function FormSelect({ options, ...props }: FormSelectProps) {
  return (
    <select
      className="w-full p-2.5 border rounded-lg text-base"
      style={{
        backgroundColor: "var(--color-bg-main)",
        color: "var(--color-text-main)",
        borderColor: "var(--color-border)",
      }}
      {...props}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}